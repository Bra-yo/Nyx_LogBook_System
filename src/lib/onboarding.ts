import { prisma } from "@/lib/prisma";

export interface LearnerOnboardingPayload {
  phone?: string | null;
  biography?: string | null;
  careerInterests?: string | null;
  preferredCommunication?: string | null;
  emergencyContact?: string | null;
}

export function normalizeLearnerOnboardingPayload(payload: LearnerOnboardingPayload) {
  const normalizeText = (value: string | null | undefined) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    phone: normalizeText(payload.phone),
    biography: normalizeText(payload.biography),
    careerInterests: normalizeText(payload.careerInterests),
    preferredCommunication: normalizeText(payload.preferredCommunication),
    emergencyContact: normalizeText(payload.emergencyContact),
  };
}

export interface RecommendationCandidate {
  id: string;
  user: { name: string | null };
  maxActiveMentees: number;
  isAcceptingNewMentees: boolean;
  learnerMentorAllocations: Array<{ status: string }>;
  mentorCompetencyGroups: Array<{ competencyGroupId: string }>;
}

export interface RecommendationInput {
  competencyGroups: Array<{ id: string; name: string; code: string }>;
  mentors: RecommendationCandidate[];
}

export function selectRecommendedMentor(input: RecommendationInput) {
  const eligibleMentors = input.mentors.filter((mentor) => {
    const activeAllocationCount = mentor.learnerMentorAllocations.filter(
      (allocation) => allocation.status === "ACTIVE",
    ).length;

    return (
      mentor.isAcceptingNewMentees &&
      activeAllocationCount < mentor.maxActiveMentees &&
      mentor.mentorCompetencyGroups.some((group) =>
        input.competencyGroups.some(
          (competencyGroup) => competencyGroup.id === group.competencyGroupId,
        ),
      )
    );
  });

  if (eligibleMentors.length === 0) {
    return null;
  }

  return eligibleMentors.sort((left, right) => {
    const leftMatchCount = left.mentorCompetencyGroups.filter((group) =>
      input.competencyGroups.some(
        (competencyGroup) => competencyGroup.id === group.competencyGroupId,
      ),
    ).length;
    const rightMatchCount = right.mentorCompetencyGroups.filter((group) =>
      input.competencyGroups.some(
        (competencyGroup) => competencyGroup.id === group.competencyGroupId,
      ),
    ).length;

    const leftCapacityScore = left.learnerMentorAllocations.filter(
      (allocation) => allocation.status === "ACTIVE",
    ).length;
    const rightCapacityScore = right.learnerMentorAllocations.filter(
      (allocation) => allocation.status === "ACTIVE",
    ).length;

    if (leftMatchCount !== rightMatchCount) {
      return rightMatchCount - leftMatchCount;
    }

    if (leftCapacityScore !== rightCapacityScore) {
      return leftCapacityScore - rightCapacityScore;
    }

    return left.user.name?.localeCompare(right.user.name ?? "") ?? 0;
  })[0];
}

export async function createLearnerOnboardingRecommendations(studentProfileId: string) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      learningArea: {
        include: {
          competencies: {
            include: {
              competencyGroups: {
                where: { status: "ACTIVE" },
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      },
    },
  });

  if (!studentProfile?.learningAreaId || !studentProfile.learningArea) {
    return { createdPaths: [], createdAllocations: [] };
  }

  const competencyGroups = studentProfile.learningArea.competencies.flatMap((competency) => competency.competencyGroups);

  if (competencyGroups.length === 0) {
    return { createdPaths: [], createdAllocations: [] };
  }

  const mentors = await prisma.supervisorProfile.findMany({
    where: {
      departmentId: studentProfile.departmentId,
      isAcceptingNewMentees: true,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      mentorCompetencyGroups: { select: { competencyGroupId: true } },
      learnerMentorAllocations: { select: { status: true } },
    },
  });

  const createdPaths: Array<{ competencyId: string; status: string }> = [];
  const createdAllocations: Array<{ learningPathId: string; mentorId: string }> = [];

  for (const competency of studentProfile.learningArea.competencies) {
    const existingLearningPath = await prisma.learnerLearningPath.findFirst({
      where: {
        learnerId: studentProfile.userId,
        competencyId: competency.id,
      },
    });

    if (existingLearningPath) {
      continue;
    }

    const learningPath = await prisma.learnerLearningPath.create({
      data: {
        learnerId: studentProfile.userId,
        competencyId: competency.id,
        status: "PLANNED",
      },
    });

    createdPaths.push({ competencyId: competency.id, status: learningPath.status });

    const recommendedMentor = selectRecommendedMentor({
      competencyGroups: competency.competencyGroups,
      mentors,
    });

    if (recommendedMentor) {
      const allocation = await prisma.learnerMentorAllocation.create({
        data: {
          learningPathId: learningPath.id,
          mentorId: recommendedMentor.id,
          status: "PENDING",
          allocationReason: "AUTO_MATCH",
          startedAt: new Date(),
        },
      });

      createdAllocations.push({ learningPathId: learningPath.id, mentorId: allocation.mentorId });
    }
  }

  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { onboardingCompleted: true },
  });

  return { createdPaths, createdAllocations };
}
