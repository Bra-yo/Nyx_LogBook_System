import test from "node:test";
import assert from "node:assert/strict";
import { selectRecommendedMentor, type RecommendationInput } from "../onboarding";

test("selects the mentor with the strongest competency match and available capacity", () => {
  const competencyGroups = [
    { id: "cg-1", name: "Research", code: "RES" },
    { id: "cg-2", name: "Reporting", code: "RPT" },
  ];

  const mentors = [
    {
      id: "mentor-1",
      user: { name: "Asha" },
      maxActiveMentees: 3,
      isAcceptingNewMentees: true,
      learnerMentorAllocations: [{ status: "ACTIVE" }],
      mentorCompetencyGroups: [{ competencyGroupId: "cg-1" }],
    },
    {
      id: "mentor-2",
      user: { name: "Brian" },
      maxActiveMentees: 5,
      isAcceptingNewMentees: true,
      learnerMentorAllocations: [{ status: "ACTIVE" }, { status: "ACTIVE" }],
      mentorCompetencyGroups: [
        { competencyGroupId: "cg-1" },
        { competencyGroupId: "cg-2" },
      ],
    },
    {
      id: "mentor-3",
      user: { name: "Cleo" },
      maxActiveMentees: 2,
      isAcceptingNewMentees: false,
      learnerMentorAllocations: [],
      mentorCompetencyGroups: [{ competencyGroupId: "cg-2" }],
    },
  ];

  const input: RecommendationInput = { competencyGroups, mentors };
  const result = selectRecommendedMentor(input);

  assert.ok(result);
  assert.equal(result?.id, "mentor-2");
});

test("returns null when no mentor is eligible", () => {
  const result = selectRecommendedMentor({
    competencyGroups: [{ id: "cg-1", name: "Research", code: "RES" }],
    mentors: [
      {
        id: "mentor-1",
        user: { name: "Asha" },
        maxActiveMentees: 1,
        isAcceptingNewMentees: true,
        learnerMentorAllocations: [{ status: "ACTIVE" }],
        mentorCompetencyGroups: [{ competencyGroupId: "cg-1" }],
      },
    ],
  });

  assert.equal(result, null);
});
