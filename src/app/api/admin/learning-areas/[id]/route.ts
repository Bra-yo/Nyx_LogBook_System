import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const learningAreaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

function buildCode(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean);

  if (words.length === 0) {
    return "LA";
  }

  const initials = words.slice(0, 3).map((word) => word[0]?.toUpperCase() ?? "");
  const code = initials.join("");

  return code || "LA";
}

function handlePrismaError(error: unknown) {
  const prismaError = error as Error & { code?: string };
  if (prismaError.code === "P2002") {
    return NextResponse.json({ success: false, error: "A learning area with the same name or code already exists" }, { status: 409 });
  }

  if (prismaError.code === "P2025") {
    return NextResponse.json({ success: false, error: "Learning area not found" }, { status: 404 });
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
    const validatedData = learningAreaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const existing = await prisma.learningArea.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Learning area not found" }, { status: 404 });
    }

    const normalizedName = validatedData.data.name.trim();
    const code = existing.code && normalizedName === existing.name ? existing.code : buildCode(normalizedName);

    const duplicate = await prisma.learningArea.findFirst({
      where: {
        OR: [{ name: { equals: normalizedName, mode: "insensitive" } }, { code }],
        NOT: [{ id }],
      },
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: "Learning area with this name or code already exists" }, { status: 409 });
    }

    const learningArea = await prisma.learningArea.update({
      where: { id },
      data: {
        name: normalizedName,
        code,
        description: validatedData.data.description?.trim() || null,
        status: validatedData.data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        sortOrder: validatedData.data.sortOrder ?? existing.sortOrder,
      },
    });

    return NextResponse.json({ success: true, learningArea });
  } catch (error) {
    console.error("Error updating learning area:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to update learning area" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.learningArea.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Learning area not found" }, { status: 404 });
    }

    await prisma.learningArea.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting learning area:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to delete learning area" }, { status: 500 });
  }
}
