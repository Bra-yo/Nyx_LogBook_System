export type CohortStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type CohortMentorshipTrack = "CAREER" | "BUSINESS";

export interface CohortCapacityInput {
  maximumCapacity: number;
  currentMembers: number;
  status?: CohortStatus | string;
}

export interface CohortEnrollmentValidationInput {
  status?: CohortStatus | string;
  maximumCapacity: number;
  currentMembers: number;
}

export interface CohortCapacitySnapshot {
  maximumCapacity: number;
  currentMembers: number;
  availableSlots: number;
  isAtCapacity: boolean;
}

export function getCohortCapacitySnapshot(
  input: CohortCapacityInput,
): CohortCapacitySnapshot {
  const maximumCapacity = Math.max(0, Number(input.maximumCapacity) || 0);
  const currentMembers = Math.max(0, Number(input.currentMembers) || 0);
  const availableSlots = Math.max(0, maximumCapacity - currentMembers);

  return {
    maximumCapacity,
    currentMembers,
    availableSlots,
    isAtCapacity: currentMembers >= maximumCapacity,
  };
}

export function validateCohortForEnrollment(
  input: CohortEnrollmentValidationInput,
  requestedMembers = 1,
): string | null {
  const normalizedStatus = String(input.status || "").toUpperCase();

  if (normalizedStatus === "ARCHIVED") {
    return "Cohort is archived and cannot accept new members.";
  }

  const snapshot = getCohortCapacitySnapshot(input);
  if (snapshot.currentMembers + requestedMembers > snapshot.maximumCapacity) {
    return "Cohort has reached maximum capacity.";
  }

  return null;
}
