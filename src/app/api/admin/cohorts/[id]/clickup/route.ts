import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCohortToClickUp, syncLearnerToClickUp } from "@/lib/services/clickup";
import { z } from "zod";

const syncSchema = z.object({ scope: z.enum(["cohort", "learner"]).default("cohort"), learnerId: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = syncSchema.parse(await request.json().catch(() => ({})));
    if (body.scope === "learner") {
      if (!body.learnerId) return NextResponse.json({ error: "learnerId is required" }, { status: 400 });
      const learner = await prisma.studentProfile.findUnique({ where: { id: body.learnerId }, select: { cohortId: true, cohort: { select: { clickupListId: true } } } });
      if (!learner || learner.cohortId !== id || !learner.cohort?.clickupListId) return NextResponse.json({ error: "Sync the cohort before syncing a learner" }, { status: 400 });
      return NextResponse.json({ success: true, task: await syncLearnerToClickUp(body.learnerId, learner.cohort.clickupListId) });
    }
    return NextResponse.json({ success: true, cohort: await syncCohortToClickUp(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ClickUp synchronization failed";
    console.error("ClickUp sync error", { cohortId: id, error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}