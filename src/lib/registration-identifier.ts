import type { PrismaClient } from "@prisma/client";
import type { UserRole } from "@/types";

export type RegistrationIdentifierType =
  | "CAREER_MENTEE"
  | "BUSINESS_MENTEE"
  | "TECHNICAL_MENTOR";

export interface RegistrationIdentifierContext {
  role: UserRole | string;
  registrationType?: RegistrationIdentifierType;
}

export interface RegistrationIdentifierResult {
  identifier: string | null;
  type: RegistrationIdentifierType | null;
}

type UserRecordWithIdentifier = {
  registrationIdentifier?: string | null;
};

type PrismaTx = Pick<PrismaClient, "user">;

const IDENTIFIER_PREFIXES: Record<RegistrationIdentifierType, string> = {
  CAREER_MENTEE: "CM-KE",
  BUSINESS_MENTEE: "BM-KE",
  TECHNICAL_MENTOR: "TM-KE",
};

const ROLE_TO_IDENTIFIER_TYPE: Partial<Record<string, RegistrationIdentifierType>> = {
  STUDENT: "CAREER_MENTEE",
  SUPERVISOR: "TECHNICAL_MENTOR",
  LECTURER: "TECHNICAL_MENTOR",
  WORKER: "TECHNICAL_MENTOR",
};

export async function generateRegistrationIdentifierForUser(
  context: RegistrationIdentifierContext,
  tx: PrismaTx,
): Promise<RegistrationIdentifierResult> {
  const identifierType = resolveRegistrationIdentifierType(context);

  if (!identifierType) {
    return { identifier: null, type: null };
  }

  const prefix = IDENTIFIER_PREFIXES[identifierType];
  const usersWithIdentifier = await tx.user.findMany({
    where: {
      registrationIdentifier: {
        startsWith: prefix,
      },
    },
    select: {
      registrationIdentifier: true,
    },
  });

  const highestSequence = usersWithIdentifier.reduce<number>((maxSequence, user) => {
    const sequence = extractSequence(user.registrationIdentifier, prefix);
    return sequence !== null && sequence > maxSequence ? sequence : maxSequence;
  }, 0);

  const nextSequence = highestSequence + 1;
  const identifier = `${prefix}-${String(nextSequence).padStart(5, "0")}`;

  return {
    identifier,
    type: identifierType,
  };
}

function resolveRegistrationIdentifierType(
  context: RegistrationIdentifierContext,
): RegistrationIdentifierType | null {
  if (context.registrationType) {
    return context.registrationType;
  }

  if (context.role === "STUDENT") {
    return "CAREER_MENTEE";
  }

  if (["SUPERVISOR", "LECTURER", "WORKER"].includes(String(context.role))) {
    return "TECHNICAL_MENTOR";
  }

  return null;
}

function extractSequence(
  registrationIdentifier: string | null | undefined,
  prefix: string,
): number | null {
  if (!registrationIdentifier) {
    return null;
  }

  const expectedPrefix = `${prefix}-`;
  if (!registrationIdentifier.startsWith(expectedPrefix)) {
    return null;
  }

  const sequencePart = registrationIdentifier.slice(expectedPrefix.length);
  const sequence = Number.parseInt(sequencePart, 10);

  return Number.isFinite(sequence) ? sequence : null;
}

export function buildRegistrationIdentifierDisplayLabel(
  registrationIdentifier: string | null | undefined,
): string {
  return registrationIdentifier ?? "Not assigned";
}
