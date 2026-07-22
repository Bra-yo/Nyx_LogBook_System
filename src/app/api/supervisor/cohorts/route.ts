import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supervisor = await prisma.supervisorProfile.findUnique({
    where: { userId: session.user.id },
    include: { cohortAssignments: true },
  });

  if (!supervisor) {
    return NextResponse.json({ error: "Supervisor profile not found" }, { status: 404 });
  }

  const cohorts = await prisma.cohort.findMany({
    where: {
      id: { in: supervisor.cohortAssignments.map((assignment) => assignment.cohortId) },
    },
    include: {
      _count: { select: { members: true } },
      members: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, cohorts });
}
