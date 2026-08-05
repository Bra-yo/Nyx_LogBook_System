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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competencyId = searchParams.get("competencyId")?.trim();

    const competencyGroups = await prisma.competencyGroup.findMany({
      where: competencyId ? { competencyId } : undefined,
      orderBy: [{ competency: { name: "asc" } }, { name: "asc" }],
      include: {
        competency: { select: { id: true, name: true, code: true, learningArea: { select: { id: true, name: true, code: true } } } },
      },
    });

    return NextResponse.json({ success: true, competencyGroups });
  } catch (error) {
    console.error("Error fetching competency groups:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch competency groups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = competencyGroupSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const competency = await prisma.competency.findUnique({ where: { id: validatedData.data.competencyId } });
    if (!competency) {
      return NextResponse.json({ success: false, error: "Competency not found" }, { status: 404 });
    }

    const normalizedName = validatedData.data.name.trim();
    const existing = await prisma.competencyGroup.findFirst({
      where: {
        competencyId: validatedData.data.competencyId,
        name: { equals: normalizedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Competency group with this name already exists in the selected competency" }, { status: 409 });
    }

    const competencyGroup = await prisma.$transaction(async (tx) => {
      const sequence = 1 + (await tx.competencyGroup.count({ where: { competencyId: validatedData.data.competencyId } }));
      return tx.competencyGroup.create({
        data: {
          competencyId: validatedData.data.competencyId,
          name: normalizedName,
          code: buildCompetencyGroupCode(competency.code, sequence),
          description: validatedData.data.description?.trim() || null,
          status: validatedData.data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        },
      });
    });

    return NextResponse.json({ success: true, competencyGroup }, { status: 201 });
  } catch (error) {
    console.error("Error creating competency group:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to create competency group" }, { status: 500 });
  }
}
