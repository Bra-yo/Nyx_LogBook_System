import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCohortForEnrollment } from "@/lib/services/cohort-management";

const cohortSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  mentorshipTrack: z.enum(["CAREER", "BUSINESS"]),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "ARCHIVED"]).default("UPCOMING"),
  description: z.string().optional(),
  maximumCapacity: z.coerce.number().int().positive().default(25),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cohorts = await prisma.cohort.findMany({
    include: {
      _count: { select: { members: true, mentorAssignments: true } },
      mentorAssignments: {
        include: { mentor: { include: { user: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, cohorts });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validated = cohortSchema.parse(body);

  const existing = await prisma.cohort.findUnique({ where: { code: validated.code } });
  if (existing) {
    return NextResponse.json({ error: "Cohort code already exists" }, { status: 400 });
  }

  const cohort = await prisma.cohort.create({
    data: {
      name: validated.name,
      code: validated.code,
      mentorshipTrack: validated.mentorshipTrack,
      status: validated.status,
      description: validated.description || null,
      maximumCapacity: validated.maximumCapacity,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      endDate: validated.endDate ? new Date(validated.endDate) : null,
    },
  });

  return NextResponse.json({ success: true, cohort });
}
