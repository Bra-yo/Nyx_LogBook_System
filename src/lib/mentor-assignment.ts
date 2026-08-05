export type MentorAssignmentStatus = "ACTIVE" | "INACTIVE";

export interface MentorAssignmentPayload {
  mentorId: string;
  competencyGroupId: string;
  status?: MentorAssignmentStatus;
  notes?: string | null;
}

export interface MentorAssignmentUpsertPlan extends MentorAssignmentPayload {
  notes: string | null;
  uniqueKey: {
    mentorId: string;
    competencyGroupId: string;
  };
}

export function buildMentorAssignmentPayload(payload: MentorAssignmentPayload): {
  mentorId: string;
  competencyGroupId: string;
  status: MentorAssignmentStatus;
  notes: string | null;
} {
  const mentorId = payload.mentorId?.trim();
  const competencyGroupId = payload.competencyGroupId?.trim();
  const notes = payload.notes?.trim() || null;

  return {
    mentorId,
    competencyGroupId,
    status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    notes,
  };
}

export function buildMentorAssignmentUpsertPlan(payload: MentorAssignmentPayload): MentorAssignmentUpsertPlan {
  const normalized = buildMentorAssignmentPayload(payload);

  return {
    ...normalized,
    notes: normalized.notes,
    uniqueKey: {
      mentorId: normalized.mentorId,
      competencyGroupId: normalized.competencyGroupId,
    },
  };
}

export function validateMentorAssignmentPayload(payload: MentorAssignmentPayload) {
  const normalized = buildMentorAssignmentPayload(payload);

  if (!normalized.mentorId) {
    throw new Error("Mentor is required");
  }

  if (!normalized.competencyGroupId) {
    throw new Error("Competency group is required");
  }

  return normalized;
}
