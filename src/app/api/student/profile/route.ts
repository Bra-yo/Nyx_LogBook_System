import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStudentProfileData,
  updateStudentProfileData,
} from "@/lib/api/studentServices";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  internshipCompany: z.string().optional(),
  internshipStartDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  internshipEndDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  regNumber: z.string().optional(),
  year: z.coerce.number().int().optional(),
  semester: z.coerce.number().int().optional(),
});

// GET - Fetch student profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await getStudentProfileData(session.user.id);
    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, student: studentProfile });
  } catch (error) {
    console.error("Get student profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update student profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true },
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

    const studentProfile = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
        },
      });

      const profile = await tx.studentProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          departmentId:
            validatedData.departmentId ||
            existingUser.studentProfile?.departmentId ||
            "",
          regNumber:
            validatedData.regNumber ||
            existingUser.studentProfile?.regNumber ||
            "",
          year: validatedData.year || existingUser.studentProfile?.year || 1,
          semester:
            validatedData.semester ||
            existingUser.studentProfile?.semester ||
            1,
          internshipCompany:
            validatedData.internshipCompany ??
            existingUser.studentProfile?.internshipCompany ??
            null,
          internshipStartDate: validatedData.internshipStartDate,
          internshipEndDate: validatedData.internshipEndDate,
        },
        update: {
          departmentId:
            validatedData.departmentId ??
            existingUser.studentProfile?.departmentId,
          regNumber:
            validatedData.regNumber ?? existingUser.studentProfile?.regNumber,
          year: validatedData.year ?? existingUser.studentProfile?.year,
          semester:
            validatedData.semester ?? existingUser.studentProfile?.semester,
          internshipCompany:
            validatedData.internshipCompany ??
            existingUser.studentProfile?.internshipCompany,
          internshipStartDate: validatedData.internshipStartDate,
          internshipEndDate: validatedData.internshipEndDate,
        },
      });

      return profile;
    });

    const refreshedProfile = await updateStudentProfileData(session.user.id, {
      internshipCompany: validatedData.internshipCompany,
      internshipStartDate: validatedData.internshipStartDate,
      internshipEndDate: validatedData.internshipEndDate,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      student: refreshedProfile,
    });
  } catch (error) {
    console.error("Update student profile error:", error);
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
