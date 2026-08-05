import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAssessmentSummary,
  getAssessmentStatusCounts,
  getAverageCompetencyScore,
  getProgressPercentage,
} from "@/lib/competency-assessment";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const learningPaths = await prisma.learnerLearningPath.findMany({
      where: {
        learnerId: session.user.id,
        status: { not: "ARCHIVED" },
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        competency: { select: { id: true, name: true, code: true } },
      },
    });

    const assessments = await prisma.competencyAssessment.findMany({
      where: {
        learnerLearningPath: {
          learnerId: session.user.id,
        },
      },
      orderBy: [{ assessmentDate: "desc" }],
      include: {
        learnerLearningPath: {
          include: {
            competency: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const finalAssessments = assessments.filter((assessment) => assessment.status === "FINAL");
    const summary = getAssessmentSummary(assessments);
    const statusCounts = getAssessmentStatusCounts(assessments);
    const averageScore = getAverageCompetencyScore(assessments);
    const progressPercentage = getProgressPercentage(assessments, learningPaths.length);

    return NextResponse.json({
      success: true,
      learningPaths: learningPaths.map((path) => ({
        id: path.id,
        competency: path.competency,
        status: path.status,
      })),
      assessmentSummary: summary,
      statusCounts,
      averageScore,
      progressPercentage,
      totalLearningPaths: learningPaths.length,
      totalFinalAssessments: finalAssessments.length,
      recentFinalAssessments: finalAssessments.slice(0, 5),
    });
  } catch (error) {
    console.error("Error fetching student competency dashboard:", error);
    return NextResponse.json({ success: false, error: "Failed to load competency dashboard" }, { status: 500 });
  }
}
