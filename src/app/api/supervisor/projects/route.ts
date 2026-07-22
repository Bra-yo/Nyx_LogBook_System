import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorCohortLearnerWhereClause, buildMentorProjectWhereClause } from "@/lib/access-control";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().optional(),
  companyName: z.string().optional(),
  departmentId: z.string().optional(),
  learnerIds: z.array(z.string()).optional(),
  workerIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!supervisor) {
      return NextResponse.json(
        { error: "Supervisor profile not found" },
        { status: 404 },
      );
    }

    const projects = await prisma.project.findMany({
      where: buildMentorProjectWhereClause(supervisor),
      include: {
        learners: {
          include: {
            learner: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        milestones: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            learners: true,
            milestones: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Failed to fetch supervisor projects:", error);
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

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!supervisor) {
      return NextResponse.json(
        { error: "Supervisor profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    const selectedLearnerIds = validatedData.learnerIds ?? [];
    const selectedWorkerIds = validatedData.workerIds ?? [];

    if (selectedLearnerIds.length > 0 && validatedData.departmentId) {
      const learners = await prisma.studentProfile.findMany({
        where: {
          id: { in: selectedLearnerIds },
          ...buildMentorCohortLearnerWhereClause(supervisor.id),
        },
        select: {
          id: true,
          departmentId: true,
        },
      });

      const invalidLearner = learners.find(
        (learner) => learner.departmentId !== validatedData.departmentId,
      );
      if (invalidLearner) {
        return NextResponse.json(
          { error: "Selected learners must belong to the chosen department" },
          { status: 400 },
        );
      }
    }

    // validate worker ids
    if (selectedWorkerIds.length > 0) {
      const workers = await prisma.workerProfile.findMany({
        where: { id: { in: selectedWorkerIds } },
        select: { id: true },
      });
      const missing = selectedWorkerIds.find(
        (id) => !workers.find((w) => w.id === id),
      );
      if (missing)
        return NextResponse.json(
          { error: "One or more selected workers do not exist" },
          { status: 400 },
        );
    }

    const project = await prisma.project.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        companyName: validatedData.companyName || null,
        departmentId: validatedData.departmentId || null,
        mentorId: supervisor.id,
        status: validatedData.status || "ACTIVE",
        learners: {
          create: selectedLearnerIds.map((learnerId) => ({
            learner: {
              connect: { id: learnerId },
            },
          })),
        },
        projectMembers:
          selectedWorkerIds.length > 0
            ? {
                create: selectedWorkerIds.map((workerId) => ({
                  worker: { connect: { id: workerId } },
                })),
              }
            : undefined,
      },
      include: {
        learners: {
          include: {
            learner: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        milestones: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        selectedLearnerIds.length > 0
          ? "Project created successfully."
          : "Project created without assigned learners.",
      project,
    });
  } catch (error) {
    console.error("Failed to create supervisor project:", error);
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
