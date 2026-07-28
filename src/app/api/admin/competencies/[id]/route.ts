import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const competencySchema = z.object({
  learningAreaId: z.string().trim().min(1, "Learning area is required"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional().nullable(),
  estimatedDurationWeeks: z.number().int().min(1).max(520).optional().nullable(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

function buildCompetencyCode(learningAreaCode: string, sequence: number) {
  return `${learningAreaCode.toUpperCase()}-KC-${String(sequence).padStart(3, "0")}`;
}

function handlePrismaError(error: unknown) {
  const prismaError = error as Error & { code?: string };
  if (prismaError.code === "P2002") {
    return NextResponse.json({ success: false, error: "A competency with the same name already exists in the selected learning area" }, { status: 409 });
  }

  if (prismaError.code === "P2025") {
    return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
  }

  return null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validatedData = competencySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existingCompetency = await prisma.competency.findUnique({ where: { id } });
    if (!existingCompetency) {
      return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
    }

    const normalizedName = validatedData.data.name.trim();
    const learningArea = await prisma.learningArea.findUnique({ where: { id: validatedData.data.learningAreaId } });
    if (!learningArea) {
      return NextResponse.json({ success: false, error: "Learning area not found" }, { status: 404 });
    }

    const duplicate = await prisma.competency.findFirst({
      where: {
        learningAreaId: validatedData.data.learningAreaId,
        name: { equals: normalizedName, mode: "insensitive" },
        NOT: [{ id }],
      },
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: "Competency with this name already exists in the selected learning area" }, { status: 409 });
    }

    const competency = await prisma.$transaction(async (tx) => {
      let code = existingCompetency.code;
      if (existingCompetency.learningAreaId !== validatedData.data.learningAreaId) {
        const sequence = 1 + (await tx.competency.count({ where: { learningAreaId: validatedData.data.learningAreaId } }));
        code = buildCompetencyCode(learningArea.code, sequence);
      }

      return tx.competency.update({
        where: { id },
        data: {
          learningAreaId: validatedData.data.learningAreaId,
          name: normalizedName,
          code,
          description: validatedData.data.description?.trim() || null,
          status: validatedData.data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          difficulty: validatedData.data.difficulty ?? null,
          estimatedDurationWeeks: validatedData.data.estimatedDurationWeeks ?? null,
          sortOrder: validatedData.data.sortOrder ?? existingCompetency.sortOrder,
        },
      });
    });

    return NextResponse.json({ success: true, competency });
  } catch (error) {
    console.error("Error updating competency:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to update competency" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingCompetency = await prisma.competency.findUnique({ where: { id } });
    if (!existingCompetency) {
      return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
    }

    await prisma.competency.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting competency:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to delete competency" }, { status: 500 });
  }
}
