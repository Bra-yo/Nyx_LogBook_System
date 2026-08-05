import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { buildMentorAssignmentUpsertPlan, validateMentorAssignmentPayload } from "@/lib/mentor-assignment";

const mentorCompetencyGroupSchema = z.object({
  mentorId: z.string().trim().min(1, "Mentor is required"),
  competencyGroupId: z.string().trim().min(1, "Competency group is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

function handlePrismaError(error: unknown) {
  const prismaError = error as Error & { code?: string };
  if (prismaError.code === "P2002") {
    return NextResponse.json({ success: false, error: "This mentor is already linked to the selected competency group" }, { status: 409 });
  }

  if (prismaError.code === "P2025") {
    return NextResponse.json({ success: false, error: "Mentor expertise record not found" }, { status: 404 });
  }

  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const mentorCompetencyGroups = await prisma.mentorCompetencyGroup.findMany({
      orderBy: [{ mentor: { user: { name: "asc" } } }, { competencyGroup: { name: "asc" } }],
      include: {
        mentor: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        competencyGroup: {
          select: {
            id: true,
            name: true,
            code: true,
            competency: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, mentorCompetencyGroups });
  } catch (error) {
    console.error("Error fetching mentor competency groups:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch mentor competency groups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = mentorCompetencyGroupSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ success: false, error: validatedData.error.issues[0]?.message || "Invalid request data" }, { status: 400 });
    }

    const normalizedPayload = validateMentorAssignmentPayload({
      mentorId: validatedData.data.mentorId,
      competencyGroupId: validatedData.data.competencyGroupId,
      status: validatedData.data.status,
      notes: validatedData.data.notes,
    });
    const upsertPlan = buildMentorAssignmentUpsertPlan(normalizedPayload);

    const mentor = await prisma.supervisorProfile.findUnique({ where: { id: upsertPlan.mentorId } });
    if (!mentor) {
      return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
    }

    const competencyGroup = await prisma.competencyGroup.findUnique({ where: { id: upsertPlan.competencyGroupId } });
    if (!competencyGroup) {
      return NextResponse.json({ success: false, error: "Competency group not found" }, { status: 404 });
    }

    const existing = await prisma.mentorCompetencyGroup.findFirst({
      where: {
        mentorId: upsertPlan.mentorId,
        competencyGroupId: upsertPlan.competencyGroupId,
      },
      include: {
        mentor: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        competencyGroup: {
          select: {
            id: true,
            name: true,
            code: true,
            competency: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, mentorCompetencyGroup: existing, duplicate: true, message: "This mentor is already linked to the selected competency group" }, { status: 200 });
    }

    const mentorCompetencyGroup = await prisma.$transaction(async (tx) => {
      return tx.mentorCompetencyGroup.create({
        data: {
          mentorId: upsertPlan.mentorId,
          competencyGroupId: upsertPlan.competencyGroupId,
          status: upsertPlan.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          notes: upsertPlan.notes,
        },
        include: {
          mentor: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          competencyGroup: {
            select: {
              id: true,
              name: true,
              code: true,
              competency: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, mentorCompetencyGroup }, { status: 201 });
  } catch (error) {
    console.error("Error creating mentor competency group:", error);
    const prismaErrorResponse = handlePrismaError(error);
    if (prismaErrorResponse) {
      return prismaErrorResponse;
    }
    return NextResponse.json({ success: false, error: "Failed to create mentor competency group" }, { status: 500 });
  }
}
