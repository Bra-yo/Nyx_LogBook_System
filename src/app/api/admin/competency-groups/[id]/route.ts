import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const competencyGroupSchema = z.object({
  competencyId: z.string().trim().min(1, "Competency is required"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

function buildCompetencyGroupCode(competencyCode: string, sequence: number) {
  return `${competencyCode.toUpperCase()}-CG-${String(sequence).padStart(3, "0")}`;
}

function handlePrismaError(error: unknown) {
  const prismaError = error as Error & { code?: string };
  if (prismaError.code === "P2002") {
    return NextResponse.json({ success: false, error: "A competency group with the same name already exists in the selected competency" }, { status: 409 });
  }

  if (prismaError.code === "P2025") {
    return NextResponse.json({ success: false, error: "Competency group not found" }, { status: 404 });
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
    const validatedData = competencyGroupSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existingGroup = await prisma.competencyGroup.findUnique({ where: { id } });
    if (!existingGroup) {
      return NextResponse.json({ success: false, error: "Competency group not found" }, { status: 404 });
    }

    const competency = await prisma.competency.findUnique({ where: { id: validatedData.data.competencyId } });
    if (!competency) {
      return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
    }

    const normalizedName = validatedData.data.name.trim();
    const duplicate = await prisma.competencyGroup.findFirst({
      where: {
        competencyId: validatedData.data.competencyId,
        name: { equals: normalizedName, mode: "insensitive" },
        NOT: [{ id }],
      },
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: "Competency group with this name already exists in the selected competency" }, { status: 409 });
    }

    const competencyGroup = await prisma.$transaction(async (tx) => {
      let code = existingGroup.code;
      if (existingGroup.competencyId !== validatedData.data.competencyId) {
        const sequence = 1 + (await tx.competencyGroup.count({ where: { competencyId: validatedData.data.competencyId } }));
        code = buildCompetencyGroupCode(competency.code, sequence);
      }

      return tx.competencyGroup.update({
        where: { id },
        data: {
          competencyId: validatedData.data.competencyId,
          name: normalizedName,
          code,
          description: validatedData.data.description?.trim() || null,
          status: validatedData.data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        },
      });
    });

    return NextResponse.json({ success: true, competencyGroup });
  } catch (error) {
    console.error("Error updating competency group:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to update competency group" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingGroup = await prisma.competencyGroup.findUnique({ where: { id } });
    if (!existingGroup) {
      return NextResponse.json({ success: false, error: "Competency group not found" }, { status: 404 });
    }

    await prisma.competencyGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting competency group:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to delete competency group" }, { status: 500 });
  }
}
