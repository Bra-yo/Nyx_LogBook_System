import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignmentSchema = z.object({
  supervisorId: z.string().min(1, "Supervisor is required"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const validated = assignmentSchema.parse(body);

  const existing = await prisma.cohortMentorAssignment.findUnique({
    where: { cohortId_supervisorId: { cohortId: id, supervisorId: validated.supervisorId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Mentor already assigned to this cohort" }, { status: 400 });
  }

  let assignment;
  try {
    assignment = await prisma.cohortMentorAssignment.create({
      data: { cohortId: id, supervisorId: validated.supervisorId },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Mentor already assigned to this cohort" }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({ success: true, assignment });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const supervisorId = searchParams.get("supervisorId");

  if (!supervisorId) {
    return NextResponse.json({ error: "Supervisor ID is required" }, { status: 400 });
  }

  await prisma.cohortMentorAssignment.deleteMany({
    where: { cohortId: id, supervisorId },
  });

  return NextResponse.json({ success: true });
}
