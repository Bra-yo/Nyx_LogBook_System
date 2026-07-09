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
    if (!supervisor)
      return NextResponse.json(
        { error: "Supervisor profile not found" },
        { status: 404 },
      );

    const project = await prisma.project.findFirst({
      where: { id, ...buildMentorProjectWhereClause(supervisor) },
    });
    if (!project)
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        worker: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Failed to fetch project workers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
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
    if (!supervisor)
      return NextResponse.json(
        { error: "Supervisor profile not found" },
        { status: 404 },
      );

    const project = await prisma.project.findFirst({
      where: { id, ...buildMentorProjectWhereClause(supervisor) },
    });
    if (!project)
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );

    const body = await request.json();
    const { workerId } = body || {};
    if (!workerId)
      return NextResponse.json(
        { error: "workerId is required" },
        { status: 400 },
      );

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
    });
    if (!worker)
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    // prevent duplicate assignment
    const exists = await prisma.projectMember.findUnique({
      where: { projectId_workerId: { projectId: id, workerId } },
    });
    if (exists)
      return NextResponse.json(
        { error: "Worker already assigned to project" },
        { status: 400 },
      );

    const member = await prisma.projectMember.create({
      data: { projectId: id, workerId },
    });
    const created = await prisma.projectMember.findUnique({
      where: { id: member.id },
      include: {
        worker: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, member: created });
  } catch (error) {
    console.error("Failed to add project worker:", error);
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
    if (!supervisor)
      return NextResponse.json(
        { error: "Supervisor profile not found" },
        { status: 404 },
      );

    const project = await prisma.project.findFirst({
      where: { id, ...buildMentorProjectWhereClause(supervisor) },
    });
    if (!project)
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );

    const body = await request.json();
    const { workerId } = body || {};
    if (!workerId)
      return NextResponse.json(
        { error: "workerId is required" },
        { status: 400 },
      );

    await prisma.projectMember.deleteMany({
      where: { projectId: id, workerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove project worker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
