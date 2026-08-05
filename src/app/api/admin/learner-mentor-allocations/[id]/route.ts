import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const dateSchema = z
  .union([z.string().datetime(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .refine((value) => !Number.isNaN(value.getTime()), { message: "Invalid date" });

const learnerMentorAllocationSchema = z.object({
  learningPathId: z.string().trim().min(1, "Learning path is required").optional(),
  mentorId: z.string().trim().min(1, "Mentor is required").optional(),
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "ENDED", "REASSIGNED"]).optional(),
  allocationReason: z.enum(["AUTO_MATCH", "MANUAL_ASSIGNMENT", "WORKLOAD_BALANCING", "SPECIALIST_REQUEST", "MENTOR_LEFT", "LEARNER_REQUEST"]).optional(),
  allocatedBy: z.string().trim().min(1, "Allocator is required").nullable().optional(),
  startedAt: dateSchema.optional(),
  endedAt: dateSchema.nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

const allocationTransitionMap: Record<string, string[]> = {
  PENDING: ["ACTIVE", "COMPLETED", "ENDED", "REASSIGNED"],
  ACTIVE: ["COMPLETED", "ENDED", "REASSIGNED"],
  COMPLETED: ["REASSIGNED", "ENDED"],
  ENDED: ["REASSIGNED"],
  REASSIGNED: ["ACTIVE", "COMPLETED", "ENDED"],
};

function validateAllocationTransition(currentStatus: string | null, nextStatus: string) {
  if (!currentStatus) {
    return true;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedTransitions = allocationTransitionMap[currentStatus] ?? [];
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
    const validatedData = learnerMentorAllocationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existing = await prisma.learnerMentorAllocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Learner mentor allocation not found" }, { status: 404 });
    }

    const learningPathId = validatedData.data.learningPathId ?? existing.learningPathId;
    const mentorId = validatedData.data.mentorId ?? existing.mentorId;
    const nextStatus = validatedData.data.status ?? existing.status;

    if (!validateAllocationTransition(existing.status, nextStatus)) {
      return NextResponse.json({ success: false, error: "Invalid mentor allocation status transition" }, { status: 400 });
    }

    const learningPath = await prisma.learnerLearningPath.findUnique({ where: { id: learningPathId } });
    if (!learningPath) {
      return NextResponse.json({ success: false, error: "Learning path not found" }, { status: 404 });
    }

    const mentor = await prisma.supervisorProfile.findUnique({ where: { id: mentorId } });
    if (!mentor) {
      return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
    }

    let allocatedByUser = null;
    if (validatedData.data.allocatedBy !== undefined) {
      if (validatedData.data.allocatedBy) {
        allocatedByUser = await prisma.user.findUnique({ where: { id: validatedData.data.allocatedBy } });
        if (!allocatedByUser) {
          return NextResponse.json({ success: false, error: "Allocator not found" }, { status: 404 });
        }
      }
    }

    const duplicateActive = await prisma.learnerMentorAllocation.findFirst({
      where: {
        learningPathId,
        status: "ACTIVE",
        NOT: { id },
      },
    });

    if (nextStatus === "ACTIVE" && duplicateActive) {
      return NextResponse.json({ success: false, error: "An active mentor allocation already exists for this learning path" }, { status: 409 });
    }

    const learnerMentorAllocation = await prisma.$transaction(async (tx) => {
      return tx.learnerMentorAllocation.update({
        where: { id },
        data: {
          learningPathId,
          mentorId,
          status: nextStatus,
          allocationReason: validatedData.data.allocationReason ?? existing.allocationReason,
          allocatedBy: validatedData.data.allocatedBy === undefined ? existing.allocatedBy : validatedData.data.allocatedBy,
          startedAt: validatedData.data.startedAt ?? existing.startedAt,
          endedAt: validatedData.data.endedAt ?? existing.endedAt,
          notes: validatedData.data.notes === undefined ? existing.notes : validatedData.data.notes?.trim() || null,
        },
        include: {
          learningPath: { select: { id: true, status: true, learnerId: true, competencyId: true } },
          mentor: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
          allocatedByUser: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({ success: true, learnerMentorAllocation });
  } catch (error) {
    console.error("Error updating learner mentor allocation:", error);
    return NextResponse.json({ success: false, error: "Failed to update learner mentor allocation" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.learnerMentorAllocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Learner mentor allocation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: "Historical allocations cannot be deleted" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting learner mentor allocation:", error);
    return NextResponse.json({ success: false, error: "Failed to delete learner mentor allocation" }, { status: 500 });
  }
}
