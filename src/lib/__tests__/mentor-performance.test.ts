import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMentorDashboardSummary,
  buildMentorLearnerPerformance,
  getRiskStatus,
} from "../services/mentor-performance";

test("buildMentorLearnerPerformance calculates percentages and risk status", () => {
  const performance = buildMentorLearnerPerformance({
    learner: {
      id: "learner-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      cohort: { startDate: new Date("2026-01-01T00:00:00.000Z") },
    },
    attendanceRecords: [
      { status: "COMPLETED" },
      { status: "COMPLETED" },
      { status: "ACTIVE" },
    ],
    milestones: [
      { status: "COMPLETED" },
      { status: "IN_PROGRESS" },
      { status: "PENDING" },
    ],
    milestoneTasks: [{ status: "COMPLETED" }, { status: "PENDING" }],
    logbookEntries: [{ status: "APPROVED" }, { status: "PENDING" }, { status: "DRAFT" }],
    weeklyReviews: [{ competencyLevel: 3 }, { competencyLevel: 2 }],
    projectLearners: [{}],
  });

  assert.equal(performance.attendancePercentage, 67);
  assert.equal(performance.taskCompletionPercentage, 50);
  assert.equal(performance.worklogCompletionPercentage, 33);
  assert.equal(performance.competencyProgressPercentage, 33);
  assert.equal(performance.overallProgress, 48);
  assert.equal(performance.riskStatus, "AMBER");
});

test("getRiskStatus flags very low performance as red", () => {
  assert.equal(
    getRiskStatus({
      attendancePercentage: 20,
      taskCompletionPercentage: 20,
      worklogCompletionPercentage: 10,
      competencyProgressPercentage: 10,
      overallProgress: 15,
    }),
    "RED",
  );
});

test("buildMentorDashboardSummary aggregates mentor-level metrics", () => {
  const summary = buildMentorDashboardSummary([
    buildMentorLearnerPerformance({
      learner: {
        id: "learner-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        cohort: { startDate: new Date("2026-01-01T00:00:00.000Z") },
      },
      attendanceRecords: [{ status: "COMPLETED" }, { status: "COMPLETED" }],
      milestones: [{ status: "COMPLETED" }, { status: "COMPLETED" }],
      milestoneTasks: [{ status: "COMPLETED" }, { status: "COMPLETED" }],
      logbookEntries: [{ status: "APPROVED" }, { status: "APPROVED" }],
      weeklyReviews: [{ competencyLevel: 3 }, { competencyLevel: 3 }],
      projectLearners: [{}],
    }),
    buildMentorLearnerPerformance({
      learner: {
        id: "learner-2",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        cohort: { startDate: new Date("2026-01-01T00:00:00.000Z") },
      },
      attendanceRecords: [{ status: "ACTIVE" }],
      milestones: [{ status: "IN_PROGRESS" }, { status: "PENDING" }],
      milestoneTasks: [{ status: "PENDING" }, { status: "PENDING" }],
      logbookEntries: [{ status: "DRAFT" }],
      weeklyReviews: [{ competencyLevel: 1 }],
      projectLearners: [{}],
    }),
  ]);

  assert.equal(summary.totalAssignedMentees, 2);
  assert.equal(summary.activeMentees, 1);
  assert.equal(summary.averageAttendance, 50);
  assert.equal(summary.averageTaskCompletion, 50);
  assert.equal(summary.averageWorklogCompletion, 50);
  assert.equal(summary.pendingReviews, 0);
});
