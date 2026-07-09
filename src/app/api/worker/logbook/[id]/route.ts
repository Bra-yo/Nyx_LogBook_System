import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  getWorkerProfileByUserId,
  getTaskWorkLogById,
  getTaskWorkLogByTaskDate,
  updateTaskWorkLog,
  deleteTaskWorkLog,
} from "@/lib/api/workerServices";

const logbookUpdateSchema = z.object({
  workDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  startTime: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  endTime: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  hoursWorked: z.number().optional(),
  progressDescription: z.string().min(1).optional(),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workerProfile = await getWorkerProfileByUserId(session.user.id);
    if (!workerProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const entry = await getTaskWorkLogById(workerProfile.id, resolvedParams.id);
    if (!entry)
      return NextResponse.json(
        { error: "Work log entry not found" },
        { status: 404 },
      );

    const mapped = {
      id: entry.id,
      title: entry.task?.taskTitle || "Task Work Log",
      description: entry.progressDescription || "",
      activities: entry.achievements || "",
      challenges: entry.challenges || undefined,
      learnings: entry.supervisorComments || undefined,
      date: entry.workDate ? new Date(entry.workDate).toISOString() : null,
      startTime: entry.startTime
        ? new Date(entry.startTime).toISOString()
        : undefined,
      endTime: entry.endTime
        ? new Date(entry.endTime).toISOString()
        : undefined,
      hoursWorked: entry.hoursWorked ?? undefined,
      achievements: entry.achievements || undefined,
      status: entry.status,
      reviewerComment: entry.supervisorComments || undefined,
      reviewedAt: entry.reviewedAt
        ? new Date(entry.reviewedAt).toISOString()
        : undefined,
      taskId: entry.taskId,
    };

    return NextResponse.json({ success: true, entry: mapped });
  } catch (error) {
    console.error("Worker get logbook entry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = logbookUpdateSchema.parse(body);

    const workerProfile = await getWorkerProfileByUserId(session.user.id);
    if (!workerProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const existingEntry = await getTaskWorkLogById(
      workerProfile.id,
      resolvedParams.id,
    );
    if (!existingEntry)
      return NextResponse.json(
        { error: "Work log entry not found" },
        { status: 404 },
      );
    if (
      existingEntry.status === "APPROVED" ||
      existingEntry.status === "PENDING"
    )
      return NextResponse.json(
        {
          error:
            "Cannot edit entry that has been submitted or already approved",
        },
        { status: 400 },
      );

    if (
      validatedData.workDate &&
      validatedData.workDate.getTime() !== existingEntry.workDate.getTime()
    ) {
      const duplicateEntry = await getTaskWorkLogByTaskDate(
        workerProfile.id,
        existingEntry.taskId,
        validatedData.workDate,
        resolvedParams.id,
      );
      if (duplicateEntry) {
        return NextResponse.json(
          { error: "A work log already exists for this date." },
          { status: 409 },
        );
      }
    }

    if (
      validatedData.startTime &&
      validatedData.endTime &&
      validatedData.endTime <= validatedData.startTime
    ) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    if (
      validatedData.hoursWorked !== undefined &&
      validatedData.hoursWorked < 0
    ) {
      return NextResponse.json(
        { error: "Hours worked must be a non-negative value" },
        { status: 400 },
      );
    }

    const entry = await updateTaskWorkLog(
      resolvedParams.id,
      workerProfile.id,
      validatedData,
    );
    return NextResponse.json({
      success: true,
      message: "Work log entry updated successfully",
      entry,
    });
  } catch (error) {
    console.error("Worker update logbook entry error:", error);
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workerProfile = await getWorkerProfileByUserId(session.user.id);
    if (!workerProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const existingEntry = await getTaskWorkLogById(
      workerProfile.id,
      resolvedParams.id,
    );
    if (!existingEntry)
      return NextResponse.json(
        { error: "Work log entry not found" },
        { status: 404 },
      );
    if (existingEntry.status !== "DRAFT")
      return NextResponse.json(
        { error: "Cannot delete entry that has been submitted" },
        { status: 400 },
      );

    await deleteTaskWorkLog(resolvedParams.id, workerProfile.id);
    return NextResponse.json({
      success: true,
      message: "Work log entry deleted successfully",
    });
  } catch (error) {
    console.error("Worker delete logbook entry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
