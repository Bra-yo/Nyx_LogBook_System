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
  internshipCompany: z.string().optional(),
  internshipStartDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  internshipEndDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
});

// GET - Fetch student profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const studentProfile = await getStudentProfileData(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

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
    if (!session?.user?.role || session.user.role !== "STUDENT")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const studentProfile = await updateStudentProfileData(
      session.user.id,
      validatedData,
    );
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      student: studentProfile,
    });
  } catch (error) {
    console.error("Update student profile error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
