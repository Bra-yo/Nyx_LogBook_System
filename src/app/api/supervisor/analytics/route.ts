import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorAnalyticsSnapshot } from "@/lib/services/analytics";
import { buildMentorCohortLearnerWhereClause } from "@/lib/access-control";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supervisor = await prisma.supervisorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true, maxActiveMentees: true } });
    if (!supervisor) return NextResponse.json({ success: false, error: "Supervisor profile not found" }, { status: 404 });

    const learnerWhere = buildMentorCohortLearnerWhereClause(supervisor.id);
    const learners = await prisma.studentProfile.findMany({
      where: learnerWhere,
      select: { id: true, userId: true },
    });

    const [projects, pendingReviews, completedReviews, learningPaths] = await Promise.all([
      prisma.project.count({ where: { mentorId: supervisor.id } }),
      prisma.logbookEntry.count({ where: { student: learnerWhere, status: "PENDING" } }),
      prisma.logbookEntry.count({ where: { student: learnerWhere, status: "APPROVED" } }),
      prisma.learnerLearningPath.findMany({
        where: { learnerId: { in: learners.map((learner) => learner.userId) } },
        select: { id: true, assessments: { select: { id: true, status: true, score: true } } },
      }),
    ]);

    const snapshot = buildMentorAnalyticsSnapshot(
      learningPaths.map((path) => ({ learningPath: { assessments: path.assessments } })),
      pendingReviews,
      projects,
      learners.length,
    );

    const insights = [
      { label: "Assigned learners", value: `${snapshot.assignedLearners}` },
      { label: "Assessment completion", value: `${snapshot.assessmentCompletionRate}%` },
      { label: "Pending reviews", value: `${snapshot.pendingReviews}` },
      { label: "Projects supervised", value: `${snapshot.projectsSupervised}` },
    ];

    return NextResponse.json({
      success: true,
      analytics: snapshot,
      capacity: supervisor.maxActiveMentees,
      learningPaths: learningPaths.length,
      completedReviews,
      insights,
      recommendations: [
        { title: "Intensify review cadence", detail: "Prioritize learners with pending reviews to speed up progression." },
        { title: "Support active learning paths", detail: "Keep the most active learning paths aligned with mentor availability." },
      ],
    });
  } catch (error) {
    console.error("Supervisor analytics error", error);
    return NextResponse.json({ success: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
