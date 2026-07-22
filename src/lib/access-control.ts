import type {
  SupervisorProfile,
  LecturerProfile,
  StudentProfile,
  Prisma,
} from "@prisma/client";

export type AccessControlRole =
  | "ADMIN"
  | "STUDENT"
  | "SUPERVISOR"
  | "LECTURER"
  | "WORKER";

export function normalizeCompanyName(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function companyMatches(a?: string | null, b?: string | null) {
  const x = normalizeCompanyName(a);
  const y = normalizeCompanyName(b);

  if (!x || !y) return false;

  return x.includes(y) || y.includes(x);
}

export function canMentorAccessLearner(
  mentorProfile: SupervisorProfile,
  learnerProfile: StudentProfile,
) {
  return companyMatches(
    mentorProfile.company,
    learnerProfile.internshipCompany,
  );
}

export function filterMentorAccessibleLearners(
  mentorProfile: SupervisorProfile,
  learners: Array<{ internshipCompany?: string | null }>,
) {
  return learners.filter((learner) =>
    canMentorAccessLearner(mentorProfile, learner as StudentProfile),
  );
}

export function buildMentorCohortLearnerWhereClause(supervisorId: string) {
  return {
    cohort: {
      mentorAssignments: {
        some: { supervisorId },
      },
    },
  };
}

export function buildMentorProjectWhereClause(
  mentorProfile: SupervisorProfile,
) {
  const orClauses: Prisma.ProjectWhereInput[] = [
    { mentorId: mentorProfile.id },
  ];

  const companyName = mentorProfile.company?.trim();
  if (companyName) {
    orClauses.push({
      companyName: {
        contains: companyName,
        mode: "insensitive",
      },
    });
  }

  return { OR: orClauses };
}

export function buildLecturerLearnerWhereClause(
  lecturerProfile: LecturerProfile,
) {
  if (!lecturerProfile.departmentId) {
    return { id: { equals: "" } };
  }

  return {
    departmentId: lecturerProfile.departmentId,
  };
}
