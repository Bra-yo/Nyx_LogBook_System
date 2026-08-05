import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assessmentSchema = z.object({
  learningPathId: z.string().trim().min(1, "Learning path is required"),
  score: z.number().int().min(1).max(5, "Score must be between 1 and 5"),
  level: z.enum(["NOT_YET_DEMONSTRATED", "EMERGING", "COMPETENT", "PROFICIENT", "EXPERT"]).optional(),
  comments: z.string().optional(),
  evidence: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "FINAL"]).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supervisorProfile = await prisma.supervisorProfile.findUnique({ where: { userId: session.user.id } });
    if (!supervisorProfile) {
      return NextResponse.json({ success: false, error: "Supervisor profile not found" }, { status: 404 });
    }

    const assessments = await prisma.competencyAssessment.findMany({
      where: { assessedBySupervisorId: supervisorProfile.id },
      orderBy: [{ assessmentDate: "desc" }],
      include: {
        learnerLearningPath: {
          include: {
            learner: { select: { id: true, name: true, email: true } },
            competency: { select: { id: true, name: true, code: true } },
          },
        },
        assessedBySupervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    const availableLearningPaths = await prisma.learnerLearningPath.findMany({
      where: {
        status: { not: "ARCHIVED" },
        mentorAllocations: {
          some: {
            mentorId: supervisorProfile.id,
            status: "ACTIVE",
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        learner: { select: { id: true, name: true, email: true } },
        competency: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, assessments, availableLearningPaths });
  } catch (error) {
    console.error("Error fetching supervisor competency assessments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch competency assessments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = assessmentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const supervisorProfile = await prisma.supervisorProfile.findUnique({ where: { userId: session.user.id } });
    if (!supervisorProfile) {
      return NextResponse.json({ success: false, error: "Supervisor profile not found" }, { status: 404 });
    }

    const learningPath = await prisma.learnerLearningPath.findUnique({ where: { id: validatedData.data.learningPathId } });
    if (!learningPath) {
      return NextResponse.json({ success: false, error: "Learning path not found" }, { status: 404 });
    }

    if (learningPath.status === "ARCHIVED") {
      return NextResponse.json({ success: false, error: "Archived learning paths cannot receive new assessments" }, { status: 400 });
    }

    const activeAllocation = await prisma.learnerMentorAllocation.findFirst({
      where: {
        learningPathId: learningPath.id,
        mentorId: supervisorProfile.id,
        status: "ACTIVE",
      },
    });

    if (!activeAllocation) {
      return NextResponse.json({ success: false, error: "You are not actively assigned to this learning path" }, { status: 403 });
    }

    const comments = validatedData.data.comments?.trim() ?? "";
    if (comments.length < 10) {
      return NextResponse.json({ success: false, error: "Comments are required and must be at least 10 characters long" }, { status: 400 });
    }

    const assessment = await prisma.competencyAssessment.create({
      data: {
        learnerLearningPathId: learningPath.id,
        assessedBySupervisorId: supervisorProfile.id,
        score: validatedData.data.score,
        level: validatedData.data.level ?? "NOT_YET_DEMONSTRATED",
        comments,
        evidence: validatedData.data.evidence?.trim() || null,
        status: validatedData.data.status ?? "DRAFT",
      },
      include: {
        learnerLearningPath: {
          include: {
            learner: { select: { id: true, name: true, email: true } },
            competency: { select: { id: true, name: true, code: true } },
          },
        },
        assessedBySupervisor: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error) {
    console.error("Error creating supervisor competency assessment:", error);
    return NextResponse.json({ success: false, error: "Failed to create competency assessment" }, { status: 500 });
  }
}
