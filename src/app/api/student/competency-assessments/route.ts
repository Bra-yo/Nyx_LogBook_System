import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assessmentQuerySchema = z.object({
  learningPathId: z.string().trim().min(1, "Learning path is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = assessmentQuerySchema.safeParse({ learningPathId: searchParams.get("learningPathId") });

    if (!query.success) {
      return NextResponse.json({ success: false, error: query.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const assessments = await prisma.competencyAssessment.findMany({
      where: {
        learnerLearningPath: {
          learnerId: session.user.id,
          id: query.data.learningPathId,
        },
      },
      orderBy: [{ assessmentDate: "desc" }],
      include: {
        assessedBySupervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
        assessedByAdmin: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json({ success: true, assessments });
  } catch (error) {
    console.error("Error fetching competency assessments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch competency assessments" }, { status: 500 });
  }
}
