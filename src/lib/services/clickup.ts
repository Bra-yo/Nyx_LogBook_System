import { prisma } from "@/lib/prisma";
import { buildLearnerProgress } from "@/lib/services/learner-progress";

const CLICKUP_API_URL = "https://api.clickup.com/api/v2";
const MAX_RETRIES = 3;

type ClickUpList = { id: string; name: string };
type ClickUpTask = { id: string; name: string; url?: string };
type ClickUpListResponse = { lists: ClickUpList[] };

class ClickUpError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ClickUpError";
  }
}

class ClickUpClient {
  private readonly token: string;
  private readonly teamId: string;

  constructor() {
    const token = process.env.CLICKUP_API_TOKEN;
    const teamId = process.env.CLICKUP_TEAM_ID;
    if (!token) throw new ClickUpError("CLICKUP_API_TOKEN is not configured");
    if (!teamId) throw new ClickUpError("CLICKUP_TEAM_ID is not configured");
    this.token = token;
    this.teamId = teamId;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch(`${CLICKUP_API_URL}${path}`, {
          ...init,
          headers: { Authorization: this.token, "Content-Type": "application/json", ...init.headers },
        });
        if (response.ok) return (await response.json()) as T;
        const body = await response.text();
        const error = new ClickUpError(`ClickUp request failed (${response.status}): ${body || response.statusText}`, response.status);
        if (response.status < 429 && response.status !== 408 && response.status >= 400) throw error;
        lastError = error;
        console.warn(`[clickup] retry ${attempt + 1}/${MAX_RETRIES}`, { path, status: response.status });
      } catch (error) {
        if (error instanceof ClickUpError && error.status && error.status < 429 && error.status !== 408) throw error;
        lastError = error;
        console.warn(`[clickup] retry ${attempt + 1}/${MAX_RETRIES}`, { path, error: error instanceof Error ? error.message : String(error) });
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
    throw lastError instanceof Error ? lastError : new ClickUpError("ClickUp request failed");
  }

  async findOrCreateList(name: string) {
    const folderId = process.env.CLICKUP_FOLDER_ID;
    const spaceId = process.env.CLICKUP_SPACE_ID;
    if (!spaceId) throw new ClickUpError("CLICKUP_SPACE_ID is not configured");
    const response = folderId
      ? await this.request<ClickUpListResponse>(`/folder/${folderId}/list`)
      : await this.request<ClickUpListResponse>(`/space/${spaceId}/list`);
    const lists = response.lists;
    const existing = lists.find((list) => list.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const parentPath = folderId ? `/folder/${folderId}/list` : `/space/${spaceId}/list`;
    console.info("[clickup] creating cohort list", { teamId: this.teamId, name });
    return this.request<ClickUpList>(parentPath, { method: "POST", body: JSON.stringify({ name }) });
  }

  getList(listId: string) {
    return this.request<ClickUpList>(`/list/${listId}`);
  }

  async findTask(listId: string, marker: string) {
    const response = await this.request<{ tasks: ClickUpTask[] }>(`/list/${listId}/task?include_closed=true`);
    return response.tasks.find((task) => task.name.includes(marker));
  }

  createTask(listId: string, payload: Record<string, unknown>) {
    return this.request<ClickUpTask>(`/list/${listId}/task`, { method: "POST", body: JSON.stringify(payload) });
  }

  updateTask(taskId: string, payload: Record<string, unknown>) {
    return this.request<ClickUpTask>(`/task/${taskId}`, { method: "PUT", body: JSON.stringify(payload) });
  }
}

function statusForLearner(accountStatus: string, paymentStatus: string, cohortStatus: string) {
  if (cohortStatus === "COMPLETED" || cohortStatus === "ARCHIVED") return "closed";
  if (accountStatus === "ACTIVE") return "in progress";
  if (paymentStatus === "PENDING" || accountStatus === "PENDING_PAYMENT") return "open";
  return "open";
}

function baseUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
}

async function learnerData(learnerId: string) {
  return prisma.studentProfile.findUnique({
    where: { id: learnerId },
    include: {
      user: true,
      cohort: true,
      supervisor: { include: { user: true } },
      _count: { select: { attendanceRecords: true, logbookEntries: true, ProjectLearner: true, assessments: true, Milestone: true } },
    },
  });
}

export async function syncLearnerToClickUp(learnerId: string, listId: string) {
  const learner = await learnerData(learnerId);
  if (!learner || !learner.cohort) throw new ClickUpError("Learner or cohort not found");
  const client = new ClickUpClient();
  const identifier = learner.user.registrationIdentifier || learner.regNumber;
  const marker = `[BGHUB:${learner.id}]`;
  const progress = buildLearnerProgress(learner.user, learner._count);
  const description = [
    marker,
    "Identity",
    `Registration Number: ${identifier}`,
    `Email: ${learner.user.email}`,
    `Phone: ${learner.user.phone || "Not provided"}`,
    "",
    "Mentorship",
    `Cohort: ${learner.cohort.name} (${learner.cohort.code})`,
    `Mentor: ${learner.supervisor?.user.name || "Not assigned"}`,
    "",
    "Progress",
    `Attendance: ${progress.attendance}`,
    `Portfolio: ${progress.portfolio ? "Available" : "Not started"}`,
    `Reports: ${progress.reports}`,
    `Projects: ${progress.projects}`,
    "",
    "Links",
    `BG HUB Learner Profile: ${baseUrl()}/supervisor/learners/${learner.id}`,
  ].join("\n");
  const payload = {
    name: `${identifier} - ${learner.user.name} ${marker}`,
    description,
    status: statusForLearner(learner.user.accountStatus, learner.user.paymentStatus, learner.cohort.status),
  };
  const existing = learner.clickupTaskId ? undefined : await client.findTask(listId, marker);
  const task = learner.clickupTaskId
    ? await client.updateTask(learner.clickupTaskId, payload)
    : existing
      ? await client.updateTask(existing.id, payload)
      : await client.createTask(listId, payload);
  await prisma.studentProfile.update({ where: { id: learner.id }, data: { clickupTaskId: task.id, clickupLastSyncedAt: new Date(), clickupSyncStatus: "SYNCED", clickupSyncError: null } });
  return task;
}

export async function syncCohortToClickUp(cohortId: string) {
  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId }, include: { members: { select: { id: true } } } });
  if (!cohort) throw new ClickUpError("Cohort not found");
  const client = new ClickUpClient();
  await prisma.cohort.update({ where: { id: cohort.id }, data: { clickupSyncStatus: "SYNCING", clickupSyncError: null } });
  try {
    let list = cohort.clickupListId ? { id: cohort.clickupListId } : undefined;
    if (list) {
      try { await client.getList(list.id); } catch (error) {
        if (!(error instanceof ClickUpError) || error.status !== 404) throw error;
        list = undefined;
      }
    }
    list ??= await client.findOrCreateList(`${cohort.name} (${cohort.code})`);
    await prisma.cohort.update({ where: { id: cohort.id }, data: { clickupListId: list.id } });
    for (const member of cohort.members) await syncLearnerToClickUp(member.id, list.id);
    return prisma.cohort.update({ where: { id: cohort.id }, data: { clickupLastSyncedAt: new Date(), clickupSyncStatus: "SYNCED", clickupSyncError: null }, include: { members: { select: { id: true, clickupTaskId: true } } } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.cohort.update({ where: { id: cohort.id }, data: { clickupSyncStatus: "FAILED", clickupSyncError: message } });
    throw error;
  }
}