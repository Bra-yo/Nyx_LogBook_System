import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorProjectWhereClause } from "@/lib/access-control";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

    const project = await prisma.project.findFirst({
      where: {
        id,
        ...buildMentorProjectWhereClause(supervisor),
      },
      include: {
        learners: {
          include: {
            learner: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
                department: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        milestones: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Failed to fetch supervisor project:", error);
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
  const { id } = await params;

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

    const project = await prisma.project.findFirst({
      where: { id, ...buildMentorProjectWhereClause(supervisor) },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete supervisor project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
