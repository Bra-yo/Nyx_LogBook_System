import test from "node:test";
import assert from "node:assert/strict";
import { generateRegistrationIdentifierForUser } from "../registration-identifier";

type MockTx = {
  user: {
    findMany: (args: unknown) => Promise<Array<{ registrationIdentifier?: string | null }>>;
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string } & Record<string, unknown>>;
  };
};

test("generates the next career mentee identifier using the highest existing sequence", async () => {
  const existingIdentifiers = ["CM-KE-00001", "CM-KE-00003"];

  const tx: MockTx = {
    user: {
      findMany: async () =>
        existingIdentifiers.map((registrationIdentifier) => ({
          registrationIdentifier,
        })),
      create: async ({ data }) => ({
        id: "new-user",
        ...data,
      }),
    },
  };

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

test("generates a technical mentor identifier for supervisor registrations", async () => {
  const tx: MockTx = {
    user: {
      findMany: async () => [],
      create: async ({ data }) => ({
        id: "new-user",
        ...data,
      }),
    },
  };

  const result = await generateRegistrationIdentifierForUser(
    {
      role: "SUPERVISOR",
    },
    tx,
  );

  assert.equal(result.identifier, "TM-KE-00001");
  assert.equal(result.type, "TECHNICAL_MENTOR");
});

test("generates a business mentee identifier when the mentorship track is business", async () => {
  const tx: MockTx = {
    user: {
      findMany: async () => [],
      create: async ({ data }) => ({
        id: "new-user",
        ...data,
      }),
    },
  };

  const result = await generateRegistrationIdentifierForUser(
    {
      role: "STUDENT",
      mentorshipTrack: "BUSINESS",
    },
    tx,
  );

  assert.equal(result.identifier, "BM-KE-00001");
  assert.equal(result.type, "BUSINESS_MENTEE");
});

test("preserves a supplied identifier when one is provided", async () => {
  const tx: MockTx = {
    user: {
      findMany: async () => [],
      create: async ({ data }) => ({
        id: "new-user",
        ...data,
      }),
    },
  };

  const result = await generateRegistrationIdentifierForUser(
    {
      role: "STUDENT",
      providedIdentifier: "CM-KE-00042",
    },
    tx,
  );

  assert.equal(result.identifier, "CM-KE-00042");
  assert.equal(result.type, "CAREER_MENTEE");
});

test("returns null for roles that do not need a mentorship identifier", async () => {
  const tx: MockTx = {
    user: {
      findMany: async () => [],
      create: async ({ data }) => ({
        id: "new-user",
        ...data,
      }),
    },
  };

  const result = await generateRegistrationIdentifierForUser(
    {
      role: "ADMIN",
    },
    tx,
  );

  assert.equal(result.identifier, null);
  assert.equal(result.type, null);
});
