import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  getWorkerProfileByUserId,
  getTaskWorkLogsForWorker,
  createTaskWorkLog,
  getTaskWorkLogByTaskDate,
  hasWorkerAttendanceToday,
} from "@/lib/api/workerServices";

const logbookSchema = z.object({
  taskId: z.string().min(1, "Task is required"),
  workDate: z.string().transform((str) => new Date(str)),
  startTime: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  endTime: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  hoursWorked: z.number().optional(),
  progressDescription: z.string().min(1, "Progress description is required"),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
  status: z.enum(["DRAFT", "PENDING"]).default("PENDING"),
});

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams));

    const workerProfile = await getWorkerProfileByUserId(session.user.id);
    if (!workerProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const result = await getTaskWorkLogsForWorker(
      workerProfile.id,
      validatedQuery,
    );

    // Map task work logs to the legacy UI shape expected by WorkLog pages
    const mapped = result.entries.map((e: any) => ({
      id: e.id,
      title: e.task?.taskTitle || "Task Work Log",
      description: e.progressDescription || "",
      activities: e.achievements || "",
      challenges: e.challenges || undefined,
      learnings: e.supervisorComments || undefined,
      date: e.workDate ? new Date(e.workDate).toISOString() : null,
      status: e.status,
      reviewerComment: e.supervisorComments || undefined,
      reviewedAt: e.reviewedAt
        ? new Date(e.reviewedAt).toISOString()
        : undefined,
    }));

    return NextResponse.json({
      entries: mapped,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Worker get logbook error:", error);
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 },
      );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = logbookSchema.parse(body);

    const workerProfile = await getWorkerProfileByUserId(session.user.id);
    if (!workerProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const hasAttendance = await hasWorkerAttendanceToday(workerProfile.id);
    if (!hasAttendance)
      return NextResponse.json(
        {
          error: "You must check in before creating a work log for today.",
          requiresCheckIn: true,
        },
        { status: 403 },
      );

    const duplicateEntry = await getTaskWorkLogByTaskDate(
      workerProfile.id,
      validatedData.taskId,
      validatedData.workDate,
    );
    if (duplicateEntry) {
      return NextResponse.json(
        { error: "A work log already exists for this task and date." },
        { status: 409 },
      );
    }

    if (validatedData.endTime && validatedData.startTime) {
      if (validatedData.endTime <= validatedData.startTime) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 },
        );
      }
    }

    if (validatedData.hoursWorked !== undefined) {
      if (validatedData.hoursWorked < 0) {
        return NextResponse.json(
          { error: "Hours worked must be a non-negative value" },
          { status: 400 },
        );
      }
    }

    const entry = await createTaskWorkLog(workerProfile.id, validatedData);
    return NextResponse.json({
      success: true,
      message: "Work log entry created successfully",
      entry,
    });
  } catch (error) {
    console.error("Worker create logbook error:", error);
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
