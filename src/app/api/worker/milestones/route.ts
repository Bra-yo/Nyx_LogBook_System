import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentProfileByUserId } from "@/lib/api/studentServices";

// GET - Fetch learner's milestones (for Worker role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await getStudentProfileByUserId(session.user.id);
    if (!studentProfile) {
      return NextResponse.json(
        {
          success: true,
          milestones: [],
          message:
            "Worker milestones will be enabled after ERP synchronization.",
        },
        { status: 200 },
      );
    }

    const milestones = await prisma.milestone.findMany({
      where: {
        OR: [
          { learnerId: studentProfile.id },
          {
            departmentId: studentProfile.departmentId,
            learnerId: null,
          },
        ],
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueDate: true,
          },
          orderBy: { createdAt: "asc" },
        },
        entries: {
          where: { studentId: studentProfile.id },
          select: { id: true, title: true, date: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const milestonesWithCounts = milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      startDate: m.startDate,
      endDate: m.endDate,
      status: m.status,
      tasks: m.tasks,
      entryCount: m.entries.length,
    }));

    return NextResponse.json({
      success: true,
      milestones: milestonesWithCounts,
    });
  } catch (error) {
    console.error("Worker get milestones error:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 },
    );
  }
}

// POST disabled for workers (milestones are managed by supervisors)
export async function POST() {
  return NextResponse.json({ error: "Not allowed" }, { status: 405 });
}
