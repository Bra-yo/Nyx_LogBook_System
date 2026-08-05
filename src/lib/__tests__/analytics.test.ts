import test from "node:test";
import assert from "node:assert/strict";
import { buildTrendIndicator, buildLearnerAnalyticsSnapshot } from "../services/analytics";

test("buildTrendIndicator returns an appropriate trend label", () => {
  assert.equal(buildTrendIndicator(80, 60), "↑ Improving");
  assert.equal(buildTrendIndicator(60, 60), "→ Stable");
  assert.equal(buildTrendIndicator(40, 60), "↓ Needs Attention");
});

test("buildLearnerAnalyticsSnapshot aggregates learner metrics", () => {
  const snapshot = buildLearnerAnalyticsSnapshot({
    learningPaths: [
      { status: "ACTIVE", competency: { name: "Communication" } },
      { status: "COMPLETED", competency: { name: "Planning" } },
    ],
    assessments: [
      { status: "FINAL", score: 4, assessmentDate: "2026-01-10" },
      { status: "FINAL", score: 2, assessmentDate: "2026-02-10" },
    ],
    logbookEntries: [
      { status: "APPROVED", hoursWorked: 4 },
      { status: "PENDING", hoursWorked: 2 },
    ],
    evidenceItems: [{ id: "1" }, { id: "2" }],
    projects: [
      { status: "COMPLETED", milestones: [{ status: "COMPLETED", tasks: [{ status: "COMPLETED" }] }] },
    ],
    pendingReviews: 1,
  });

  assert.equal(snapshot.competencyCompletion, 50);
  assert.equal(snapshot.averageAssessmentScore, 3);
  assert.equal(snapshot.hoursLogged, 6);
  assert.equal(snapshot.evidenceSubmitted, 2);
  assert.equal(snapshot.portfolioCompletion, 100);
});
