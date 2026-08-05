import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAssessmentSchema = z.object({
  learningPathId: z.string().trim().min(1, "Learning path is required").optional(),
  score: z.number().int().min(1).max(5, "Score must be between 1 and 5").optional(),
  level: z.enum(["NOT_YET_DEMONSTRATED", "EMERGING", "COMPETENT", "PROFICIENT", "EXPERT"]).optional(),
  comments: z.string().optional(),
  evidence: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "FINAL"]).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
    if (!adminProfile) {
      return NextResponse.json({ success: false, error: "Admin profile not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validatedData = updateAssessmentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existingAssessment = await prisma.competencyAssessment.findUnique({
      where: { id },
      include: { learnerLearningPath: true },
    });

    if (!existingAssessment) {
      return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
    }

    if (existingAssessment.assessedByAdminId !== adminProfile.id) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this assessment" }, { status: 403 });
    }

    if (existingAssessment.status === "FINAL") {
      return NextResponse.json({ success: false, error: "Final assessments cannot be modified" }, { status: 400 });
    }

    const learningPathId = validatedData.data.learningPathId ?? existingAssessment.learnerLearningPathId;
    const learningPath = await prisma.learnerLearningPath.findUnique({ where: { id: learningPathId } });
    if (!learningPath) {
      return NextResponse.json({ success: false, error: "Learning path not found" }, { status: 404 });
    }

    if (learningPath.status === "ARCHIVED") {
      return NextResponse.json({ success: false, error: "Archived learning paths cannot receive assessments" }, { status: 400 });
    }

    const comments = validatedData.data.comments?.trim() ?? existingAssessment.comments ?? "";
    if (comments.length < 10) {
      return NextResponse.json({ success: false, error: "Comments are required and must be at least 10 characters long" }, { status: 400 });
    }

    const updatedAssessment = await prisma.competencyAssessment.update({
      where: { id },
      data: {
        learnerLearningPathId: learningPath.id,
        score: validatedData.data.score ?? existingAssessment.score,
        level: validatedData.data.level ?? existingAssessment.level,
        comments,
        evidence: validatedData.data.evidence?.trim() ?? existingAssessment.evidence,
        status: validatedData.data.status ?? existingAssessment.status,
      },
      include: {
        learnerLearningPath: {
          include: {
            learner: { select: { id: true, name: true, email: true } },
            competency: { select: { id: true, name: true, code: true } },
          },
        },
        assessedByAdmin: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json({ success: true, assessment: updatedAssessment });
  } catch (error) {
    console.error("Error updating admin competency assessment:", error);
    return NextResponse.json({ success: false, error: "Failed to update competency assessment" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
    if (!adminProfile) {
      return NextResponse.json({ success: false, error: "Admin profile not found" }, { status: 404 });
    }

    const { id } = await params;
    const existingAssessment = await prisma.competencyAssessment.findUnique({ where: { id } });

    if (!existingAssessment) {
      return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
    }

    if (existingAssessment.assessedByAdminId !== adminProfile.id) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this assessment" }, { status: 403 });
    }

    if (existingAssessment.status !== "DRAFT") {
      return NextResponse.json({ success: false, error: "Only draft assessments can be deleted" }, { status: 400 });
    }

    await prisma.competencyAssessment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Assessment deleted" });
  } catch (error) {
    console.error("Error deleting admin competency assessment:", error);
    return NextResponse.json({ success: false, error: "Failed to delete competency assessment" }, { status: 500 });
  }
}
