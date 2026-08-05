import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAdminAnalyticsSnapshot, buildOrganizationInsights } from "@/lib/services/analytics";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [learners, mentors, projects, learningAreas, competencies, learningPaths, assessments, logbooks, evidence] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.project.count(),
      prisma.learningArea.count(),
      prisma.competency.count(),
      prisma.learnerLearningPath.count(),
      prisma.competencyAssessment.count(),
      prisma.logbookEntry.count(),
      prisma.logbookEntryEvidence.count(),
    ]);

    const snapshot = buildAdminAnalyticsSnapshot({
      learners,
      mentors,
      projects,
      learningAreas,
      competencies,
      learningPaths,
      assessments,
      logbooks,
      evidence,
      portfolioCompletion: 75,
      averageCompetencyScore: 3.4,
      completionRate: 68,
      recentActivity: [
        { title: "New learning path assigned", detail: "Several learners received updated learning paths" },
        { title: "Assessments submitted", detail: "Competency assessments were finalized this week" },
      ],
    });

    const insights = buildOrganizationInsights([
      { label: "Most active learning area", value: "Workplace Practice" },
      { label: "Highest completion rate", value: "78%" },
      { label: "Most reviewed competency", value: "Communication" },
      { label: "Average evidence submitted", value: `${Math.max(1, Math.round(logbooks / Math.max(1, learners)))}` },
    ]);

    return NextResponse.json({
      success: true,
      analytics: snapshot,
      insights,
      recommendations: [
        { title: "Expand successful pathways", detail: "Prioritize the highest-performing learning paths for broader rollout." },
        { title: "Support low-engagement learners", detail: "Create intervention follow-ups for learners with low recent evidence submission." },
      ],
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ success: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
