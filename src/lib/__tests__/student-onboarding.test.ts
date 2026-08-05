import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLearnerOnboardingPayload } from "../onboarding";

test("normalizes learner onboarding payload values and trims whitespace", () => {
  const result = normalizeLearnerOnboardingPayload({
    phone: "  +254700000000  ",
    biography: "  I am a motivated learner.  ",
    careerInterests: "  AI, Robotics  ",
    preferredCommunication: "  WHATSAPP  ",
    emergencyContact: "  Sister Mary  ",
  });

  assert.deepEqual(result, {
    phone: "+254700000000",
    biography: "I am a motivated learner.",
    careerInterests: "AI, Robotics",
    preferredCommunication: "WHATSAPP",
    emergencyContact: "Sister Mary",
  });
});

test("drops blank onboarding fields", () => {
  const result = normalizeLearnerOnboardingPayload({
    phone: "   ",
    biography: "",
    careerInterests: "   ",
    preferredCommunication: undefined,
    emergencyContact: null,
  });

  assert.deepEqual(result, {
    phone: undefined,
    biography: undefined,
    careerInterests: undefined,
    preferredCommunication: undefined,
    emergencyContact: undefined,
  });
});
