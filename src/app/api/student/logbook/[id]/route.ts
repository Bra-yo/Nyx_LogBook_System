import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStudentProfileByUserId,
  getLogbookEntryForStudent,
  updateLogbookEntryForStudent,
  deleteLogbookEntryForStudent,
} from "@/lib/api/studentServices";
import { z } from "zod";

const logbookUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  activities: z.string().min(1, "Activities are required").optional(),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  date: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
  attachments: z.array(z.string()).optional(),
});

// GET - Fetch single logbook entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

    const entry = await getLogbookEntryForStudent(
      studentProfile.id,
      resolvedParams.id,
    );
    if (!entry)
      return NextResponse.json(
        { error: "Logbook entry not found" },
        { status: 404 },
      );

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Get logbook entry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update logbook entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = logbookUpdateSchema.parse(body);

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

    const existingEntry = await prisma.logbookEntry.findFirst({
      where: { id: resolvedParams.id, studentId: studentProfile.id },
    });
    if (!existingEntry)
      return NextResponse.json(
        { error: "Logbook entry not found" },
        { status: 404 },
      );
    if (
      existingEntry.status === "APPROVED" ||
      existingEntry.status === "REJECTED"
    )
      return NextResponse.json(
        { error: "Cannot edit entry that has been reviewed" },
        { status: 400 },
      );

    const entry = await updateLogbookEntryForStudent(
      resolvedParams.id,
      studentProfile.id,
      validatedData,
    );
    return NextResponse.json({
      success: true,
      message: "Logbook entry updated successfully",
      entry,
    });
  } catch (error) {
    console.error("Update logbook entry error:", error);
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

// DELETE - Delete logbook entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

    const existingEntry = await prisma.logbookEntry.findFirst({
      where: { id: resolvedParams.id, studentId: studentProfile.id },
    });
    if (!existingEntry)
      return NextResponse.json(
        { error: "Logbook entry not found" },
        { status: 404 },
      );
    if (
      existingEntry.status === "PENDING" ||
      existingEntry.status === "APPROVED" ||
      existingEntry.status === "REJECTED"
    )
      return NextResponse.json(
        { error: "Cannot delete entry that has been submitted" },
        { status: 400 },
      );

    await deleteLogbookEntryForStudent(resolvedParams.id);
    return NextResponse.json({
      success: true,
      message: "Logbook entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete logbook entry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
