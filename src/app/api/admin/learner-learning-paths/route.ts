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
  learnerId: z.string().trim().min(1, "Learner is required"),
  competencyId: z.string().trim().min(1, "Competency is required"),
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

function handlePrismaError(error: unknown) {
  const prismaError = error as Error & { code?: string };
  if (prismaError.code === "P2025") {
    return NextResponse.json({ success: false, error: "Learner learning path not found" }, { status: 404 });
  }

  return null;
}

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const learnerLearningPaths = await prisma.learnerLearningPath.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        learner: { select: { id: true, name: true, email: true } },
        competency: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, learnerLearningPaths });
  } catch (error) {
    console.error("Error fetching learner learning paths:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch learner learning paths" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = learnerLearningPathSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const learner = await prisma.user.findUnique({ where: { id: validatedData.data.learnerId } });
    if (!learner) {
      return NextResponse.json({ success: false, error: "Learner not found" }, { status: 404 });
    }

    const competency = await prisma.competency.findUnique({ where: { id: validatedData.data.competencyId } });
    if (!competency) {
      return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
    }

    const nextStatus = validatedData.data.status ?? "PLANNED";
    const duplicateActive = await prisma.learnerLearningPath.findFirst({
      where: {
        learnerId: validatedData.data.learnerId,
        competencyId: validatedData.data.competencyId,
        status: "ACTIVE",
      },
    });

    if (nextStatus === "ACTIVE" && duplicateActive) {
      return NextResponse.json({ success: false, error: "An active learning path already exists for this learner and competency" }, { status: 409 });
    }

    const learnerLearningPath = await prisma.$transaction(async (tx) => {
      return tx.learnerLearningPath.create({
        data: {
          learnerId: validatedData.data.learnerId,
          competencyId: validatedData.data.competencyId,
          status: nextStatus,
          startedAt: validatedData.data.startedAt,
          completedAt: validatedData.data.completedAt,
        },
        include: {
          learner: { select: { id: true, name: true, email: true } },
          competency: { select: { id: true, name: true, code: true } },
        },
      });
    });

    return NextResponse.json({ success: true, learnerLearningPath }, { status: 201 });
  } catch (error) {
    console.error("Error creating learner learning path:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to create learner learning path" }, { status: 500 });
  }
}
