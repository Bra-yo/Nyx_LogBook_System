import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const portfolioUpdateSchema = z.object({
  bio: z.string().trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  certificates: z.array(z.any()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
});

function normalizeStringArray(value: unknown): string[] {
  // Safely convert any value to a string array
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCertificates(
  value: unknown,
): Array<{ name: string; type: string; dataUrl: string; uploadedAt: string }> {
  // Safely convert any value to a certificate array
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    )
    .map((item) => ({
      name: typeof item.name === "string" ? item.name.trim() : "",
      type: typeof item.type === "string" ? item.type.trim() : "",
      dataUrl: typeof item.dataUrl === "string" ? item.dataUrl.trim() : "",
      uploadedAt:
        typeof item.uploadedAt === "string" && item.uploadedAt.length > 0
          ? item.uploadedAt
          : new Date().toISOString(),
    }))
    .filter((item) => Boolean(item.name && item.dataUrl));
}

function normalizeSocialLinks(value: unknown): Record<string, string> {
  // Safely convert any value to a social links object
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};

  try {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, entry]) => {
        if (typeof entry === "string" && entry.trim().length > 0) {
          acc[key] = entry.trim();
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        bio: true,
        skills: true,
        certificates: true,
        socialLinks: true,
        studentProfile: {
          select: {
            id: true,
            regNumber: true,
            year: true,
            semester: true,
            department: true,
            internshipCompany: true,
            createdAt: true,
          },
        },
        supervisorProfile: {
          select: {
            id: true,
            title: true,
            company: true,
            department: true,
            createdAt: true,
          },
        },
        lecturerProfile: {
          select: {
            id: true,
            title: true,
            department: true,
            createdAt: true,
          },
        },
        adminProfile: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        workerProfile: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            department: true,
            phoneNumber: true,
            email: true,
            staffNumber: true,
            dateEmployed: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile =
      user.studentProfile ||
      user.supervisorProfile ||
      user.lecturerProfile ||
      user.adminProfile ||
      user.workerProfile;

    const [projects, tasks, workLogs, milestones] = await Promise.all([
      prisma.project.count({
        where: {
          OR: [
            {
              projectMembers: { some: { worker: { userId: session.user.id } } },
            },
            {
              tasks: { some: { assignedWorker: { userId: session.user.id } } },
            },
            { learners: { some: { learner: { userId: session.user.id } } } },
            { mentor: { userId: session.user.id } },
            { supervisor: { userId: session.user.id } },
          ],
        },
      }),
      prisma.task.count({
        where: {
          OR: [
            { assignedWorker: { userId: session.user.id } },
            {
              project: {
                learners: { some: { learner: { userId: session.user.id } } },
              },
            },
            { project: { mentor: { userId: session.user.id } } },
            { project: { supervisor: { userId: session.user.id } } },
          ],
        },
      }),
      prisma.taskWorkLog.findMany({
        where: { worker: { userId: session.user.id } },
        select: {
          id: true,
          hoursWorked: true,
          submittedAt: true,
          workDate: true,
          task: { select: { taskTitle: true } },
        },
        orderBy: { workDate: "desc" },
      }),
      prisma.milestone.findMany({
        where: {
          OR: [
            { learner: { userId: session.user.id } },
            { mentor: { userId: session.user.id } },
            {
              project: {
                learners: { some: { learner: { userId: session.user.id } } },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          endDate: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const completedTasks = tasks > 0 ? tasks : 0;
    const pendingTasks = Math.max(
      0,
      completedTasks - Math.max(1, workLogs.length),
    );
    const totalHours = workLogs.reduce(
      (sum, item) => sum + (item.hoursWorked ?? 0),
      0,
    );
    const submittedWorkLogs = workLogs.filter(
      (item) => item.submittedAt,
    ).length;

    const weeklyHours = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (5 - index) * 7);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const weekLogs = workLogs.filter((entry) => {
        const entryDate = entry.workDate ? new Date(entry.workDate) : null;
        return entryDate && entryDate >= start && entryDate <= end;
      });
      const total = weekLogs.reduce(
        (sum, item) => sum + (item.hoursWorked ?? 0),
        0,
      );
      return { label: `W${index + 1}`, totalHours: Number(total.toFixed(1)) };
    });

    const monthlyHours = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const monthLogs = workLogs.filter((entry) => {
        const entryDate = entry.workDate ? new Date(entry.workDate) : null;
        return (
          entryDate &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      });
      const total = monthLogs.reduce(
        (sum, item) => sum + (item.hoursWorked ?? 0),
        0,
      );
      return {
        label: date.toLocaleString("en", { month: "short" }),
        totalHours: Number(total.toFixed(1)),
      };
    });

    const monthlyTasks = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const monthMilestones = milestones.filter((item) => {
        const itemDate = item.createdAt ? new Date(item.createdAt) : null;
        return (
          itemDate &&
          itemDate.getMonth() === date.getMonth() &&
          itemDate.getFullYear() === date.getFullYear()
        );
      });
      return {
        label: date.toLocaleString("en", { month: "short" }),
        completed: monthMilestones.length,
      };
    });

    const completionRate =
      projects > 0
        ? Math.min(
            100,
            Math.round((submittedWorkLogs / Math.max(1, projects * 3)) * 100),
          )
        : 0;
    const monthlyProductivity = Math.max(
      0,
      Math.round((totalHours / Math.max(1, projects || 1)) * 10) / 10,
    );
    const weeklyProductivity = Math.max(
      0,
      Math.round((totalHours / Math.max(1, workLogs.length || 1)) * 10) / 10,
    );

    const achievements = [] as Array<{ title: string; detail: string }>;
    if (projects >= 1)
      achievements.push({
        title: "Completed first project",
        detail: `You have joined ${projects} project${projects > 1 ? "s" : ""}.`,
      });
    if (submittedWorkLogs >= 100)
      achievements.push({
        title: "100 worklogs submitted",
        detail: "You have built a strong habit of consistent updates.",
      });
    if (totalHours >= 500)
      achievements.push({
        title: "500 hours worked",
        detail: "A sustained delivery record is visible in your activity.",
      });
    if (weeklyHours.some((entry) => entry.totalHours >= 10))
      achievements.push({
        title: "Consistent weekly submissions",
        detail: "You maintain steady effort across the week.",
      });
    if (completionRate >= 80)
      achievements.push({
        title: "Excellent completion rate",
        detail: "Your delivery rate is above the target threshold.",
      });

    const timeline = [
      { title: "Joined the system", date: user.createdAt, type: "joined" },
      ...milestones.map((item) => ({
        title: item.title,
        date: item.endDate || item.createdAt,
        type: item.status.toLowerCase(),
      })),
      ...workLogs.slice(0, 8).map((item) => ({
        title: `Submitted ${item.task?.taskTitle || "worklog"}`,
        date: item.submittedAt || item.workDate,
        type: "worklog",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const normalizedSkills = normalizeStringArray(user.skills) || [];
    const normalizedCertificates =
      normalizeCertificates(user.certificates) || [];
    const normalizedSocialLinks = normalizeSocialLinks(user.socialLinks) || {};

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? user.workerProfile?.phoneNumber ?? null,
        avatar: user.avatar,
        role: user.role,
        bio: typeof user.bio === "string" ? user.bio : null,
        skills: Array.isArray(normalizedSkills) ? normalizedSkills : [],
        certificates: Array.isArray(normalizedCertificates)
          ? normalizedCertificates
          : [],
        socialLinks:
          normalizedSocialLinks &&
          typeof normalizedSocialLinks === "object" &&
          !Array.isArray(normalizedSocialLinks)
            ? normalizedSocialLinks
            : {},
        company:
          user.supervisorProfile?.company ||
          user.workerProfile?.department ||
          user.studentProfile?.internshipCompany ||
          null,
        department:
          user.studentProfile?.department?.name ||
          user.supervisorProfile?.department?.name ||
          user.lecturerProfile?.department?.name ||
          user.workerProfile?.department ||
          null,
        roleTitle:
          user.workerProfile?.jobTitle ||
          user.supervisorProfile?.title ||
          user.lecturerProfile?.title ||
          user.studentProfile?.regNumber ||
          null,
        profile: profile,
      },
      summary: {
        projectsCompleted: projects,
        activeProjects: Math.max(0, projects - 1),
        tasksCompleted: completedTasks,
        tasksPending: pendingTasks,
        worklogsSubmitted: submittedWorkLogs,
        totalHoursWorked: Number(totalHours.toFixed(1)),
        weeklyProductivity: weeklyProductivity,
        monthlyProductivity: monthlyProductivity,
        completionRate,
      },
      achievements,
      timeline,
      charts: {
        weeklyHours,
        monthlyHours,
        monthlyTasks,
        productivityTrend: weeklyHours.map((entry, index) => ({
          label: entry.label,
          value: Number((entry.totalHours + index).toFixed(1)),
        })),
      },
    });
  } catch (error) {
    console.error("Portfolio get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = portfolioUpdateSchema.parse(body);

    const normalizedSkills = normalizeStringArray(data.skills) || [];
    const normalizedCertificates =
      normalizeCertificates(data.certificates) || [];
    const normalizedSocialLinks = normalizeSocialLinks(data.socialLinks) || {};

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio:
          typeof data.bio === "string" && data.bio.trim().length > 0
            ? data.bio.trim()
            : null,
        skills: Array.isArray(normalizedSkills) ? normalizedSkills : [],
        certificates: Array.isArray(normalizedCertificates)
          ? normalizedCertificates
          : [],
        socialLinks:
          normalizedSocialLinks &&
          typeof normalizedSocialLinks === "object" &&
          !Array.isArray(normalizedSocialLinks)
            ? normalizedSocialLinks
            : {},
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Portfolio update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
