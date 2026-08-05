import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildLearnerAnalyticsSnapshot } from "@/lib/services/analytics";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [learningPaths, assessments, logbookEntries, evidenceItems, projects] = await Promise.all([
      prisma.learnerLearningPath.findMany({
        where: { learnerId: session.user.id, status: { not: "ARCHIVED" } },
        select: { id: true, status: true, competency: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.competencyAssessment.findMany({
        where: { learnerLearningPath: { learnerId: session.user.id } },
        select: { id: true, status: true, score: true, assessmentDate: true, learnerLearningPath: { select: { competency: { select: { id: true, name: true } } } } },
        orderBy: { assessmentDate: "desc" },
      }),
      prisma.logbookEntry.findMany({
        where: { student: { userId: session.user.id } },
        select: { id: true, status: true, hoursWorked: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.logbookEntryEvidence.findMany({
        where: { logbookEntry: { student: { userId: session.user.id } } },
        select: { id: true },
      }),
      prisma.project.findMany({
        where: { learners: { some: { learner: { userId: session.user.id } } } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          milestones: {
            select: {
              id: true,
              status: true,
              tasks: { select: { id: true, status: true } },
            },
          },
          learners: { select: { id: true } },
        },
      }),
    ]);

    const snapshot = buildLearnerAnalyticsSnapshot({
      learningPaths,
      assessments,
      logbookEntries,
      evidenceItems,
      projects,
      pendingReviews: logbookEntries.filter((entry) => entry.status === "PENDING").length,
    });

    const recommendations = [
      snapshot.pendingReviews > 0 ? { title: "Review pending submissions", detail: "Complete the outstanding review cycle for your latest work records." } : { title: "Keep momentum", detail: "Your current cadence is healthy; continue submitting evidence regularly." },
      snapshot.hoursLogged < 10 ? { title: "Log additional hours", detail: "Increase your logged hours to strengthen the evidence trail for your portfolio." } : { title: "Maintain consistency", detail: "Your logged hours are strong; keep the momentum going." },
    ];

    return NextResponse.json({
      success: true,
      analytics: snapshot,
      recommendations,
      recentActivity: [
        { title: "Recent assessments", detail: `${assessments.length} assessment records available` },
        { title: "Evidence submitted", detail: `${evidenceItems.length} evidence items attached` },
      ],
    });
  } catch (error) {
    console.error("Student analytics error", error);
    return NextResponse.json({ success: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
