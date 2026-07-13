import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.adminProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Administrator profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { adminProfile: true },
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

    const admin = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
        },
      });

      return tx.adminProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          departmentId:
            validatedData.departmentId ||
            existingUser.adminProfile?.departmentId ||
            "",
        },
        update: { departmentId: validatedData.departmentId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Administrator profile updated successfully",
      admin,
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
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
