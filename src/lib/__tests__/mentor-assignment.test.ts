import test from "node:test";
import assert from "node:assert/strict";
import { buildMentorAssignmentPayload, buildMentorAssignmentUpsertPlan, validateMentorAssignmentPayload } from "../mentor-assignment";

test("buildMentorAssignmentPayload normalizes and defaults the assignment payload", () => {
  const payload = buildMentorAssignmentPayload({
    mentorId: "  mentor-1  ",
    competencyGroupId: "  group-1  ",
    notes: "  Ready for onboarding  ",
  });

  assert.deepEqual(payload, {
    mentorId: "mentor-1",
    competencyGroupId: "group-1",
    status: "ACTIVE",
    notes: "Ready for onboarding",
  });
});

test("validateMentorAssignmentPayload rejects missing mentor or competency group", () => {
  assert.throws(
    () => validateMentorAssignmentPayload({ mentorId: " ", competencyGroupId: "", status: "ACTIVE" }),
    /Mentor is required/,
  );

  assert.throws(
    () => validateMentorAssignmentPayload({ mentorId: "mentor-1", competencyGroupId: " ", status: "ACTIVE" }),
    /Competency group is required/,
  );
});

test("buildMentorAssignmentUpsertPlan normalizes the unique key and assignment payload", () => {
  const plan = buildMentorAssignmentUpsertPlan({
    mentorId: "  mentor-1  ",
    competencyGroupId: "  group-1  ",
    status: "INACTIVE",
    notes: "  Existing relationship  ",
  });

  assert.deepEqual(plan, {
    mentorId: "mentor-1",
    competencyGroupId: "group-1",
    status: "INACTIVE",
    notes: "Existing relationship",
    uniqueKey: {
      mentorId: "mentor-1",
      competencyGroupId: "group-1",
    },
  });
});
