import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const mentorCompetencyGroupSchema = z.object({
  mentorId: z.string().trim().min(1, "Mentor is required"),
  competencyGroupId: z.string().trim().min(1, "Competency group is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

function handlePrismaError(error: unknown) {
  const prismaError = error as Error & { code?: string };
  if (prismaError.code === "P2002") {
    return NextResponse.json({ success: false, error: "This mentor is already linked to the selected competency group" }, { status: 409 });
  }

  if (prismaError.code === "P2025") {
    return NextResponse.json({ success: false, error: "Mentor expertise record not found" }, { status: 404 });
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
    const validatedData = mentorCompetencyGroupSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existingRecord = await prisma.mentorCompetencyGroup.findUnique({ where: { id } });
    if (!existingRecord) {
      return NextResponse.json({ success: false, error: "Mentor expertise record not found" }, { status: 404 });
    }

    const mentor = await prisma.supervisorProfile.findUnique({ where: { id: validatedData.data.mentorId } });
    if (!mentor) {
      return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
    }

    const competencyGroup = await prisma.competencyGroup.findUnique({ where: { id: validatedData.data.competencyGroupId } });
    if (!competencyGroup) {
      return NextResponse.json({ success: false, error: "Competency group not found" }, { status: 404 });
    }

    const duplicate = await prisma.mentorCompetencyGroup.findFirst({
      where: {
        mentorId: validatedData.data.mentorId,
        competencyGroupId: validatedData.data.competencyGroupId,
        NOT: [{ id }],
      },
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: "This mentor is already linked to the selected competency group" }, { status: 409 });
    }

    const mentorCompetencyGroup = await prisma.$transaction(async (tx) => {
      return tx.mentorCompetencyGroup.update({
        where: { id },
        data: {
          mentorId: validatedData.data.mentorId,
          competencyGroupId: validatedData.data.competencyGroupId,
          status: validatedData.data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          notes: validatedData.data.notes?.trim() || null,
        },
        include: {
          mentor: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          competencyGroup: {
            select: {
              id: true,
              name: true,
              code: true,
              competency: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, mentorCompetencyGroup });
  } catch (error) {
    console.error("Error updating mentor competency group:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to update mentor competency group" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingRecord = await prisma.mentorCompetencyGroup.findUnique({ where: { id } });
    if (!existingRecord) {
      return NextResponse.json({ success: false, error: "Mentor expertise record not found" }, { status: 404 });
    }

    await prisma.mentorCompetencyGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mentor competency group:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to delete mentor competency group" }, { status: 500 });
  }
}
