import test from "node:test";
import assert from "node:assert/strict";
import { getCohortCapacitySnapshot, validateCohortForEnrollment } from "../services/cohort-management";

test("reports available slots and capacity state", () => {
  const snapshot = getCohortCapacitySnapshot({
    maximumCapacity: 12,
    currentMembers: 8,
  });

  assert.equal(snapshot.currentMembers, 8);
  assert.equal(snapshot.availableSlots, 4);
  assert.equal(snapshot.isAtCapacity, false);
});

test("rejects archived cohorts and full cohorts for enrollment", () => {
  const archived = validateCohortForEnrollment(
    {
      status: "ARCHIVED",
      maximumCapacity: 10,
      currentMembers: 4,
    },
    5,
  );

  assert.match(archived, /archived/i);

  const full = validateCohortForEnrollment(
    {
      status: "ACTIVE",
      maximumCapacity: 4,
      currentMembers: 4,
    },
    5,
  );

  assert.match(full, /capacity/i);
});
