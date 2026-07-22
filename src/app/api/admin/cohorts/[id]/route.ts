import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cohortSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  code: z.string().min(1, "Code is required").optional(),
  mentorshipTrack: z.enum(["CAREER", "BUSINESS"]).optional(),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  description: z.string().optional(),
  maximumCapacity: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const cohort = await prisma.cohort.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true, mentorAssignments: true } },
      mentorAssignments: {
        include: { mentor: { include: { user: true } } },
      },
      members: {
        include: { user: true },
      },
    },
  });

  if (!cohort) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, cohort });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const validated = cohortSchema.parse(body);

  if (validated.code) {
    const existing = await prisma.cohort.findFirst({ where: { code: validated.code, NOT: { id } } });
    if (existing) {
      return NextResponse.json({ error: "Cohort code already exists" }, { status: 400 });
    }
  }

  const cohort = await prisma.cohort.update({
    where: { id },
    data: {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    },
  });

  return NextResponse.json({ success: true, cohort });
}
