import { readFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType: string;
}

export interface EmailMessage {
  userId: string;
  to: string;
  subject: string;
  html: string;
  attachment: EmailAttachment;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass: password },
  });
}

export async function createAndSendEmail(message: EmailMessage): Promise<string> {
  const delivery = await prisma.emailDelivery.create({
    data: {
      userId: message.userId,
      toEmail: message.to,
      subject: message.subject,
      htmlBody: message.html,
      attachmentPath: message.attachment.path,
      attachmentName: message.attachment.filename,
    },
  });

  await sendEmailDelivery(delivery.id);
  return delivery.id;
}

export async function sendEmailDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.emailDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.status === "SENT") return;

  try {
    await readFile(delivery.attachmentPath);
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: delivery.toEmail,
      subject: delivery.subject,
      html: delivery.htmlBody,
      attachments: [{
        filename: delivery.attachmentName,
        path: delivery.attachmentPath,
        contentType: "application/pdf",
      }],
    });

    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "SENT", sentAt: new Date(), lastError: null, attempts: { increment: 1 } },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", lastError: message, attempts: { increment: 1 } },
    });
    console.error(`Email delivery failed for ${delivery.toEmail}:`, error);
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}