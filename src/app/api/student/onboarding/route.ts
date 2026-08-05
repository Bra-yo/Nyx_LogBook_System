import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createLearnerOnboardingRecommendations,
  normalizeLearnerOnboardingPayload,
} from "@/lib/onboarding";
import { z } from "zod";

const onboardingSchema = z.object({
  phone: z.string().optional().nullable(),
  biography: z.string().optional().nullable(),
  careerInterests: z.string().optional().nullable(),
  preferredCommunication: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        learningArea: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!studentProfile) {
      return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 404 });
    }

    const learningPaths = await prisma.learnerLearningPath.findMany({
      where: { learnerId: studentProfile.userId },
      include: {
        competency: { select: { id: true, name: true, code: true } },
        mentorAllocations: {
          include: {
            mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      studentProfile: {
        id: studentProfile.id,
        onboardingCompleted: studentProfile.onboardingCompleted,
        learningArea: studentProfile.learningArea,
      },
      learningPaths,
    });
  } catch (error) {
    console.error("Error loading onboarding state:", error);
    return NextResponse.json({ success: false, error: "Failed to load onboarding state" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = onboardingSchema.parse(body);
    const normalizedData = normalizeLearnerOnboardingPayload(validatedData);
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
    if (!studentProfile) {
      return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 404 });
    }

    if (!studentProfile.learningAreaId) {
      return NextResponse.json({ success: false, error: "Learning area is required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          phone: normalizedData.phone ?? null,
          bio: normalizedData.biography ?? null,
          skills: normalizedData.careerInterests ? normalizedData.careerInterests.split(",").map((item) => item.trim()).filter(Boolean) : [],
        },
      });

      await tx.studentProfile.update({
        where: { id: studentProfile.id },
        data: {
          onboardingCompleted: true,
          registrationType: studentProfile.registrationType ?? null,
        },
      });
    });

    const recommendations = await createLearnerOnboardingRecommendations(studentProfile.id);
    const learningPaths = await prisma.learnerLearningPath.findMany({
      where: { learnerId: session.user.id },
      include: {
        competency: { select: { id: true, name: true, code: true } },
        mentorAllocations: {
          include: {
            mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, recommendations, learningPaths });
  } catch (error) {
    console.error("Error creating onboarding recommendations:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create onboarding recommendations" }, { status: 500 });
  }
}
