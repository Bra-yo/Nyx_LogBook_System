import { prisma } from "@/lib/prisma";
import type { UserRole, PaymentStatus as PrismaPaymentStatus, AccountStatus as PrismaAccountStatus } from "@prisma/client";

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
  };
}

export async function sendPaymentConfirmedEmail(userEmail: string, userName: string) {
  if (!process.env.EMAIL_FROM) {
    return null;
  }

  return {
    to: userEmail,
    subject: "Payment Confirmed - Your account is now active",
    html: `<p>Hello ${userName},</p><p>Your payment has been confirmed and your account is now active. You may log in to the platform.</p>`,
  };
}
