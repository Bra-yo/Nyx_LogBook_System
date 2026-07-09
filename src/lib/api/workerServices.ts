import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { LogStatus, TaskStatus } from "@prisma/client";

export async function getWorkerProfileByUserId(userId: string) {
  return prisma.workerProfile.findUnique({ where: { userId } });
}

interface WorkerQuery {
  page?: string;
  limit?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export async function getWorkerProjectsForWorker(workerProfileId: string) {
  return prisma.project.findMany({
    where: {
      projectMembers: {
        some: {
          workerId: workerProfileId,
        },
      },
    },
    include: {
      projectMembers: {
        include: {
          worker: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          taskTitle: true,
          status: true,
          expectedEndDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkerTasksForWorker(
  workerProfileId: string,
  query: WorkerQuery,
) {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "10", 10);
  const skip = (page - 1) * limit;
  const where: Prisma.TaskWhereInput = {
    assignedWorkerId: workerProfileId,
  };

  if (query.status) where.status = query.status as TaskStatus;
  if (query.startDate || query.endDate) {
    where.expectedStartDate = {};
    if (query.startDate)
      (where.expectedStartDate as Prisma.DateTimeFilter).gte = new Date(
        query.startDate,
      );
    if (query.endDate)
      (where.expectedStartDate as Prisma.DateTimeFilter).lte = new Date(
        query.endDate,
      );
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { expectedEndDate: "asc" },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getWorkerTaskById(
  workerProfileId: string,
  taskId: string,
) {
  return prisma.task.findFirst({
    where: { id: taskId, assignedWorkerId: workerProfileId },
    include: {
      project: true,
    },
  });
}

export interface TaskWorkLogInput {
  taskId: string;
  workDate: Date;
  startTime?: Date;
  endTime?: Date;
  hoursWorked?: number;
  progressDescription: string;
  achievements?: string;
  challenges?: string;
  completionPercentage?: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  supervisorComments?: string | null;
}

export async function getTaskWorkLogsForWorker(
  workerProfileId: string,
  query: WorkerQuery,
) {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "10", 10);
  const skip = (page - 1) * limit;
  const where: Prisma.TaskWorkLogWhereInput = {
    workerId: workerProfileId,
  };

  if (query.status) where.status = query.status as LogStatus;
  if (query.startDate || query.endDate) {
    where.workDate = {};
    if (query.startDate)
      (where.workDate as Prisma.DateTimeFilter).gte = new Date(query.startDate);
    if (query.endDate)
      (where.workDate as Prisma.DateTimeFilter).lte = new Date(query.endDate);
  }

  const [entries, total] = await Promise.all([
    prisma.taskWorkLog.findMany({
      where,
      include: {
        task: {
          select: { taskTitle: true, status: true },
        },
      },
      orderBy: { workDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.taskWorkLog.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function createTaskWorkLog(
  workerProfileId: string,
  data: TaskWorkLogInput,
) {
  return prisma.taskWorkLog.create({
    data: {
      workerId: workerProfileId,
      taskId: data.taskId,
      workDate: data.workDate,
      startTime: data.startTime,
      endTime: data.endTime,
      hoursWorked: data.hoursWorked,
      progressDescription: data.progressDescription,
      achievements: data.achievements,
      challenges: data.challenges,
      completionPercentage: data.completionPercentage,
      status: data.status,
      submittedAt: data.status === "PENDING" ? new Date() : undefined,
      supervisorComments: data.supervisorComments,
    },
  });
}

export async function getTaskWorkLogById(
  workerProfileId: string,
  entryId: string,
) {
  return prisma.taskWorkLog.findFirst({
    where: { id: entryId, workerId: workerProfileId },
    include: {
      task: true,
    },
  });
}

export async function getTaskWorkLogByTaskDate(
  workerProfileId: string,
  taskId: string,
  workDate: Date,
  excludeEntryId?: string,
) {
  const startOfDay = new Date(workDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(workDate);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.taskWorkLog.findFirst({
    where: {
      workerId: workerProfileId,
      taskId,
      workDate: { gte: startOfDay, lte: endOfDay },
      ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
    },
  });
}

export async function updateTaskWorkLog(
  entryId: string,
  workerProfileId: string,
  data: Partial<TaskWorkLogInput>,
) {
  const updateData: Partial<TaskWorkLogInput & { submittedAt?: Date }> = {
    ...data,
  };
  if (data.status === "PENDING") updateData.submittedAt = new Date();

  return prisma.taskWorkLog.update({
    where: { id: entryId },
    data: updateData,
  });
}

export async function deleteTaskWorkLog(
  entryId: string,
  workerProfileId: string,
) {
  return prisma.taskWorkLog.delete({
    where: { id: entryId },
  });
}

export async function hasWorkerAttendanceToday(workerProfileId: string) {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const attendance = await prisma.attendance.findFirst({
    where: {
      workerId: workerProfileId,
      checkInTime: { gte: startOfDay, lte: endOfDay },
      OR: [{ status: "ACTIVE" }, { status: "COMPLETED" }],
    },
  });

  return Boolean(attendance);
}
