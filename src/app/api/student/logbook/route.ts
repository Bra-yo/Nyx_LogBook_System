import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStudentProfileByUserId,
  getLogbookEntriesForStudent,
  createLogbookEntryForStudent,
} from "@/lib/api/studentServices";
import { createTimelineEntry } from "@/lib/services/notification-service";
import { z } from "zod";

const evidenceItemSchema = z.object({
  type: z.enum(["DOCUMENT", "IMAGE", "VIDEO", "LINK", "SOURCE_CODE"]),
  title: z.string().optional(),
  url: z.string().url("Evidence URL must be valid"),
  description: z.string().optional(),
});

const logbookSchema = z.object({
  learningPathId: z.string().min(1, "Learning path selection is required"),
  projectId: z.string().min(1, "Project selection is required"),
  milestoneId: z.string().min(1, "Milestone selection is required"),
  milestoneTaskId: z.string().min(1, "Task selection is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  activities: z.string().min(1, "Activities are required"),
  hoursWorked: z.number().min(0, "Hours worked must be a positive number").optional(),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  status: z
    .enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"])
    .default("PENDING"),
  attachments: z.array(z.string()).default([]),
  evidenceItems: z.array(evidenceItemSchema).optional(),
});

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET - Fetch student's logbook entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams));

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

    const result = await getLogbookEntriesForStudent(
      studentProfile.id,
      validatedQuery,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Get logbook entries error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new logbook entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = logbookSchema.parse(body);

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );

    // Validate attendance and project/milestone/task similar to previous implementation
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: studentProfile.id,
        checkInTime: { gte: startOfDay, lte: endOfDay },
        OR: [{ status: "ACTIVE" }, { status: "COMPLETED" }],
      },
    });

    if (!todayAttendance) {
      return NextResponse.json(
        {
          error: "You must check in before creating a logbook entry for today.",
          requiresCheckIn: true,
        },
        { status: 403 },
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        learners: { some: { learnerId: studentProfile.id } },
      },
    });
    if (!project)
      return NextResponse.json(
        { error: "Selected project is not assigned to you or does not exist" },
        { status: 400 },
      );

    const milestone = await prisma.milestone.findUnique({
      where: { id: validatedData.milestoneId },
    });
    if (!milestone || milestone.projectId !== project.id)
      return NextResponse.json(
        { error: "Selected milestone does not belong to the selected project" },
        { status: 400 },
      );

    const task = await prisma.milestoneTask.findUnique({
      where: { id: validatedData.milestoneTaskId },
    });
    if (!task || task.milestoneId !== validatedData.milestoneId)
      return NextResponse.json(
        { error: "Selected task does not belong to the selected milestone" },
        { status: 400 },
      );

    const learningPath = await prisma.learnerLearningPath.findFirst({
      where: {
        id: validatedData.learningPathId,
        learnerId: studentProfile.id,
        status: "ACTIVE",
      },
      include: {
        competency: { include: { learningArea: true } },
        mentorAllocations: {
          where: { status: "ACTIVE" },
          include: { mentor: { include: { user: true } } },
        },
      },
    });
    if (!learningPath)
      return NextResponse.json(
        {
          error:
            "Selected learning path is not active, not assigned to you, or does not exist",
        },
        { status: 400 },
      );

    const entry = await createLogbookEntryForStudent(
      studentProfile.id,
      validatedData,
    );

    await createTimelineEntry({
      userId: studentProfile.userId,
      eventType: "LOGBOOK_ENTRY_CREATED",
      title: "Work log entry saved",
      description: `Your work log entry "${entry.title}" was ${entry.status === "PENDING" ? "submitted" : "saved"}.`,
      entityType: "LogbookEntry",
      entityId: entry.id,
      metadata: { status: entry.status },
    });

    return NextResponse.json({
      success: true,
      message: "Logbook entry created successfully",
      entry,
    });
  } catch (error) {
    console.error("Create logbook entry error:", error);
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
