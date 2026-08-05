import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const dateSchema = z
  .union([z.string().datetime(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .refine((value) => !Number.isNaN(value.getTime()), { message: "Invalid date" });

const learnerLearningPathSchema = z.object({
  learnerId: z.string().trim().min(1, "Learner is required").optional(),
  competencyId: z.string().trim().min(1, "Competency is required").optional(),
  status: z.enum(["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  startedAt: dateSchema.optional(),
  completedAt: dateSchema.optional(),
});

const learningPathTransitionMap: Record<string, string[]> = {
  PLANNED: ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
  ACTIVE: ["PAUSED", "COMPLETED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

function validateLearningPathTransition(currentStatus: string | null, nextStatus: string) {
  if (!currentStatus) {
    return true;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedTransitions = learningPathTransitionMap[currentStatus] ?? [];
  return allowedTransitions.includes(nextStatus);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validatedData = learnerLearningPathSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existing = await prisma.learnerLearningPath.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Learner learning path not found" }, { status: 404 });
    }

    const learnerId = validatedData.data.learnerId ?? existing.learnerId;
    const competencyId = validatedData.data.competencyId ?? existing.competencyId;
    const nextStatus = validatedData.data.status ?? existing.status;

    if (!validateLearningPathTransition(existing.status, nextStatus)) {
      return NextResponse.json({ success: false, error: "Invalid learning path status transition" }, { status: 400 });
    }

    const learner = await prisma.user.findUnique({ where: { id: learnerId } });
    if (!learner) {
      return NextResponse.json({ success: false, error: "Learner not found" }, { status: 404 });
    }

    const competency = await prisma.competency.findUnique({ where: { id: competencyId } });
    if (!competency) {
      return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
    }

    const duplicateActive = await prisma.learnerLearningPath.findFirst({
      where: {
        learnerId,
        competencyId,
        status: "ACTIVE",
        NOT: { id },
      },
    });

    if (nextStatus === "ACTIVE" && duplicateActive) {
      return NextResponse.json({ success: false, error: "An active learning path already exists for this learner and competency" }, { status: 409 });
    }

    const learnerLearningPath = await prisma.$transaction(async (tx) => {
      return tx.learnerLearningPath.update({
        where: { id },
        data: {
          learnerId,
          competencyId,
          status: nextStatus,
          startedAt: validatedData.data.startedAt ?? existing.startedAt,
          completedAt: validatedData.data.completedAt ?? existing.completedAt,
        },
        include: {
          learner: { select: { id: true, name: true, email: true } },
          competency: { select: { id: true, name: true, code: true } },
        },
      });
    });

    return NextResponse.json({ success: true, learnerLearningPath });
  } catch (error) {
    console.error("Error updating learner learning path:", error);
    return NextResponse.json({ success: false, error: "Failed to update learner learning path" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.learnerLearningPath.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Learner learning path not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: "Learning history cannot be deleted" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting learner learning path:", error);
    return NextResponse.json({ success: false, error: "Failed to delete learner learning path" }, { status: 500 });
  }
}
