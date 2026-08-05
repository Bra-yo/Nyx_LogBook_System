import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: string;
  priority?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.JsonValue;
  archived?: boolean;
  read?: boolean;
}

export interface CreateTimelineEntryInput {
  userId: string;
  eventType: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.JsonValue;
}

export async function createNotification(
  input: CreateNotificationInput,
) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      category: input.category ?? "GENERAL",
      priority: input.priority ?? "NORMAL",
      read: input.read ?? false,
      archived: input.archived ?? false,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadNotificationCountForUser(userId: string) {
  return prisma.notification.count({
    where: { userId, archived: false, read: false },
  });
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  return prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: { read: true },
  });
}

export async function createTimelineEntry(
  input: CreateTimelineEntryInput,
) {
  return prisma.activityTimelineEntry.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createNotificationEvent(
  notification: CreateNotificationInput,
  timeline?: CreateTimelineEntryInput,
) {
  return prisma.$transaction(async (tx) => {
    const notificationResult = await tx.notification.create({
      data: {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type ?? "info",
        category: notification.category ?? "GENERAL",
        priority: notification.priority ?? "NORMAL",
        read: notification.read ?? false,
        archived: notification.archived ?? false,
        entityType: notification.entityType,
        entityId: notification.entityId,
        metadata: notification.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    const timelineResult = timeline
      ? await tx.activityTimelineEntry.create({
          data: {
            userId: timeline.userId,
            eventType: timeline.eventType,
            title: timeline.title,
            description: timeline.description,
            entityType: timeline.entityType,
            entityId: timeline.entityId,
            metadata: timeline.metadata as Prisma.InputJsonValue | undefined,
          },
        })
      : null;

    return { notification: notificationResult, timeline: timelineResult };
  });
}
