import { prisma } from "@/lib/prisma";
import { createAndSendEmail, escapeHtml } from "./services/email-service";
import type { UserRole, PaymentStatus as PrismaPaymentStatus, AccountStatus as PrismaAccountStatus } from "@prisma/client";

function buildLoginUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/auth/signin`;
}

export type PaymentStatus = PrismaPaymentStatus;
export type AccountStatus = PrismaAccountStatus;

interface PaymentConfirmationInput {
  confirmedBy: string;
  role: UserRole;
  paymentStatus?: PaymentStatus | null;
}

export function buildPaymentConfirmationUpdate({
  confirmedBy,
  role,
  paymentStatus,
}: PaymentConfirmationInput) {
  const confirmedAt = new Date();

  return {
    paymentStatus: (paymentStatus === "WAIVED" ? "WAIVED" : "PAID") as PrismaPaymentStatus,
    accountStatus: "ACTIVE" as PrismaAccountStatus,
    paymentConfirmedAt: confirmedAt,
    paymentConfirmedBy: confirmedBy,
  };
}

export async function confirmPaymentForUser(userId: string, confirmedBy: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      paymentStatus: true,
      accountStatus: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const alreadyConfirmed = user.paymentStatus === "PAID" || user.accountStatus === "ACTIVE";

  if (alreadyConfirmed) {
    return {
      userId,
      email: user.email,
      name: user.name,
      update: {
        paymentStatus: user.paymentStatus,
        accountStatus: user.accountStatus,
        paymentConfirmedAt: null,
        paymentConfirmedBy: null,
      },
      changed: false,
    };
  }

  const update = buildPaymentConfirmationUpdate({
    confirmedBy,
    role: user.role,
    paymentStatus: user.paymentStatus as PaymentStatus | null,
  });

  await prisma.user.update({
    where: { id: userId },
    data: update,
  });

  return {
    userId,
    email: user.email,
    name: user.name,
    update,
    changed: true,
  };
}

export interface PaymentConfirmationEmailInput {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  registrationIdentifier?: string | null;
  studentProfile?: {
    mentorshipTrack: "CAREER" | "BUSINESS" | null;
    cohort: { name: string } | null;
  } | null;
  defaultPassword?: string;
}

export function buildPaymentConfirmationEmailMessage(user: PaymentConfirmationEmailInput, defaultPassword = user.defaultPassword || process.env.DEFAULT_USER_PASSWORD || "ChangeMe123") {
  const loginUrl = buildLoginUrl();
  const html = `<div style="font-family:Helvetica;line-height:1.6;color:#172033;max-width:640px"><h2>Official Admission to the BGhub Kenya Mentorship Programme</h2><p>Dear ${escapeHtml(user.name)},</p><p>Congratulations! Your payment has been confirmed, your registration is now complete, and your account has been activated.</p><p>Use the following login credentials to access the platform:</p><ul><li><strong>Login Email:</strong> ${escapeHtml(user.email)}</li><li><strong>Username:</strong> ${escapeHtml(user.email)}</li><li><strong>Default Password:</strong> ${escapeHtml(defaultPassword)}</li><li><strong>Login URL:</strong> <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></li></ul><p>Please change your password immediately after your first sign-in.</p><p>If you need help, please contact us at <a href="mailto:info@bghub.co.ke">info@bghub.co.ke</a>.</p><p>Regards,<br>BGhub Kenya</p></div>`;

  return {
    subject: "Official Admission to the BGhub Kenya Mentorship Programme",
    html,
  };
}

export async function sendPaymentConfirmedEmail(user: PaymentConfirmationEmailInput) {
  if (user.role !== "STUDENT" || !user.registrationIdentifier) {
    return null;
  }

  const defaultPassword = user.defaultPassword || process.env.DEFAULT_USER_PASSWORD || "ChangeMe123";

  try {
    const { subject, html } = buildPaymentConfirmationEmailMessage(user, defaultPassword);

    const deliveryId = await createAndSendEmail({
      userId: user.id,
      to: user.email,
      subject,
      html,
    });

    return {
      to: user.email,
      subject,
      html,
      deliveryId,
    };
  } catch (error) {
    console.error(`Failed to generate and send final admission letter for ${user.email}:`, error);
    throw error;
  }
}
