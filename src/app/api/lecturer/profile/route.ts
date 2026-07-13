import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  office: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, lecturer });
  } catch (error) {
    console.error("Get lecturer profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { lecturerProfile: true },
    });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (validatedData.email && validatedData.email !== existingUser.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Duplicate email" }, { status: 400 });
      }
    }

    const lecturer = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
        },
      });

      return tx.lecturerProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          departmentId: existingUser.lecturerProfile?.departmentId || "",
          title: validatedData.title ?? null,
          office: validatedData.office ?? null,
        },
        update: { title: validatedData.title, office: validatedData.office },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Lecturer profile updated successfully",
      lecturer,
    });
  } catch (error) {
    console.error("Update lecturer profile error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
