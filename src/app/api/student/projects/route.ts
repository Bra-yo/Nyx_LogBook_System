import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStudentProfileByUserId,
  getProjectsForStudent,
} from "@/lib/api/studentServices";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

    const projects = await getProjectsForStudent(studentProfile.id);
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Failed to fetch learner projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
