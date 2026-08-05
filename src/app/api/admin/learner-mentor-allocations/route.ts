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
  learningPathId: z.string().trim().min(1, "Learning path is required"),
  mentorId: z.string().trim().min(1, "Mentor is required"),
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const learnerMentorAllocations = await prisma.learnerMentorAllocation.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        learningPath: { select: { id: true, status: true, learnerId: true, competencyId: true } },
        mentor: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
        allocatedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, learnerMentorAllocations });
  } catch (error) {
    console.error("Error fetching learner mentor allocations:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch learner mentor allocations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = learnerMentorAllocationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const learningPath = await prisma.learnerLearningPath.findUnique({ where: { id: validatedData.data.learningPathId } });
    if (!learningPath) {
      return NextResponse.json({ success: false, error: "Learning path not found" }, { status: 404 });
    }

    const mentor = await prisma.supervisorProfile.findUnique({ where: { id: validatedData.data.mentorId } });
    if (!mentor) {
      return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
    }

    let allocatedByUser = null;
    if (validatedData.data.allocatedBy) {
      allocatedByUser = await prisma.user.findUnique({ where: { id: validatedData.data.allocatedBy } });
      if (!allocatedByUser) {
        return NextResponse.json({ success: false, error: "Allocator not found" }, { status: 404 });
      }
    }

    const nextStatus = validatedData.data.status ?? "PENDING";
    const duplicateActive = await prisma.learnerMentorAllocation.findFirst({
      where: {
        learningPathId: validatedData.data.learningPathId,
        status: "ACTIVE",
      },
    });

    if (nextStatus === "ACTIVE" && duplicateActive) {
      return NextResponse.json({ success: false, error: "An active mentor allocation already exists for this learning path" }, { status: 409 });
    }

    const learnerMentorAllocation = await prisma.$transaction(async (tx) => {
      return tx.learnerMentorAllocation.create({
        data: {
          learningPathId: validatedData.data.learningPathId,
          mentorId: validatedData.data.mentorId,
          status: nextStatus,
          allocationReason: validatedData.data.allocationReason ?? "AUTO_MATCH",
          allocatedBy: validatedData.data.allocatedBy ?? null,
          startedAt: validatedData.data.startedAt ?? new Date(),
          endedAt: validatedData.data.endedAt ?? null,
          notes: validatedData.data.notes?.trim() || null,
        },
        include: {
          learningPath: { select: { id: true, status: true, learnerId: true, competencyId: true } },
          mentor: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
          allocatedByUser: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({ success: true, learnerMentorAllocation }, { status: 201 });
  } catch (error) {
    console.error("Error creating learner mentor allocation:", error);
    return NextResponse.json({ success: false, error: "Failed to create learner mentor allocation" }, { status: 500 });
  }
}
