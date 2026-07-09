import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { buildMentorProjectWhereClause } from "@/lib/access-control";

const reviewSchema = z.object({
  entryId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewerComment: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!supervisor) {
      return NextResponse.json({ entries: [] });
    }

    const companyName = supervisor.company?.trim();
    const whereClause: any = {
      status: "PENDING",
      task: {
        project: {
          OR: [{ supervisorId: supervisor.id }],
        },
      },
    };

    if (companyName) {
      whereClause.task.project.OR.push({
        companyName: {
          contains: companyName,
          mode: "insensitive",
        },
      });
    }

    const entries = await prisma.taskWorkLog.findMany({
      where: whereClause,
      orderBy: { workDate: "desc" },
      include: {
        task: {
          include: {
            project: true,
            assignedWorker: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Worker review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisor) {
      return NextResponse.json(
        { error: "Supervisor profile not found" },
        { status: 404 },
      );
    }

    const entry = await prisma.taskWorkLog.findUnique({
      where: { id: validatedData.entryId },
      include: {
        worker: {
          include: { user: true },
        },
      },
    });
    if (!entry) {
      return NextResponse.json(
        { error: "Work log entry not found" },
        { status: 404 },
      );
    }

    if (entry.status === "APPROVED") {
      return NextResponse.json(
        { error: "Entry is already approved" },
        { status: 400 },
      );
    }

    await prisma.taskWorkLog.update({
      where: { id: validatedData.entryId },
      data: {
        status: validatedData.status,
        supervisorComments: validatedData.reviewerComment,
        reviewedAt: new Date(),
        reviewedBy: supervisor.id,
      },
    });

    if (entry.worker.user) {
      await prisma.notification.create({
        data: {
          userId: entry.worker.user.id,
          title:
            validatedData.status === "APPROVED"
              ? "Work log approved"
              : "Work log rejected",
          message:
            validatedData.status === "APPROVED"
              ? "Your work log has been approved by your supervisor."
              : "Your work log has been rejected. Please review the comment and submit again.",
          type: validatedData.status === "APPROVED" ? "success" : "error",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Review saved" });
  } catch (error) {
    console.error("Worker review error:", error);
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
