import test from "node:test";
import assert from "node:assert/strict";
import { generateRegistrationIdentifierForUser } from "../registration-identifier";

test("generates the next career mentee identifier using the highest existing sequence", async () => {
  const existingIdentifiers = ["CM-KE-00001", "CM-KE-00003"];

  const tx = {
    user: {
      findMany: async () =>
        existingIdentifiers.map((registrationIdentifier) => ({
          registrationIdentifier,
        })),
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "new-user",
        ...data,
      }),
    },
  } as any;

  const result = await generateRegistrationIdentifierForUser(
    {
      role: "STUDENT",
      registrationType: "CAREER_MENTEE",
    },
    tx,
  );

  assert.equal(result.identifier, "CM-KE-00004");
  assert.equal(result.type, "CAREER_MENTEE");
});

test("returns null for roles that do not need a mentorship identifier", async () => {
  const tx = {
    user: {
      findMany: async () => [],
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "new-user",
        ...data,
      }),
    },
  } as any;

  const result = await generateRegistrationIdentifierForUser(
    {
      role: "ADMIN",
    },
    tx,
  );

  assert.equal(result.identifier, null);
  assert.equal(result.type, null);
});
