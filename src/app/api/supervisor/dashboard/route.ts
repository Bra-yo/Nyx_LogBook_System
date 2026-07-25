import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorCohortLearnerWhereClause } from "@/lib/access-control";
import { buildMentorDashboardSummary, buildMentorLearnerPerformance } from "@/lib/services/mentor-performance";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supervisor = await prisma.supervisorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!supervisor) return NextResponse.json({ error: "Supervisor profile not found" }, { status: 404 });

  const learnerWhere = buildMentorCohortLearnerWhereClause(supervisor.id);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryWhere = { student: learnerWhere };
  const [learners, totalLearners, pendingReviews, approvedToday, weeklySubmissions, recentEntries] = await Promise.all([
    prisma.studentProfile.findMany({
      where: learnerWhere,
      select: {
        id: true,
        createdAt: true,
        cohort: { select: { startDate: true } },
        attendanceRecords: { select: { status: true } },
        Milestone: {
          select: {
            status: true,
            tasks: { select: { status: true } },
          },
        },
        logbookEntries: { select: { status: true } },
        WeeklyMentorTaskReview: { select: { competencyLevel: true } },
        ProjectLearner: { select: { id: true } },
      },
    }),
    prisma.studentProfile.count({ where: learnerWhere }),
    prisma.logbookEntry.count({ where: { ...entryWhere, status: "PENDING" } }),
    prisma.logbookEntry.count({ where: { ...entryWhere, status: "APPROVED", updatedAt: { gte: today } } }),
    prisma.logbookEntry.count({ where: { ...entryWhere, createdAt: { gte: weekAgo } } }),
    prisma.logbookEntry.findMany({
      where: entryWhere,
      select: { id: true, title: true, status: true, createdAt: true, student: { select: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const performances = learners.map((learner) => buildMentorLearnerPerformance({
    learner: { id: learner.id, createdAt: learner.createdAt, cohort: learner.cohort ? { startDate: learner.cohort.startDate } : null },
    attendanceRecords: learner.attendanceRecords,
    milestones: learner.Milestone.map((milestone) => ({ status: milestone.status })),
    milestoneTasks: learner.Milestone.flatMap((milestone) => milestone.tasks.map((task) => ({ status: task.status }))),
    logbookEntries: learner.logbookEntries,
    weeklyReviews: learner.WeeklyMentorTaskReview,
    projectLearners: learner.ProjectLearner,
  }));

  return NextResponse.json({
    success: true,
    stats: { totalLearners, pendingReviews, approvedToday, weeklySubmissions },
    summary: buildMentorDashboardSummary(performances),
    recentEntries,
  });
}