import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { LogStatus } from "@/types";

export async function getStudentProfileByUserId(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

interface LogbookQuery {
  page?: string;
  limit?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export async function getLogbookEntriesForStudent(
  studentProfileId: string,
  query: LogbookQuery,
) {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;
  const where: Prisma.LogbookEntryWhereInput = { studentId: studentProfileId };
  if (query.status) where.status = query.status as LogStatus;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate)
      (where.date as Prisma.DateTimeFilter).gte = new Date(query.startDate);
    if (query.endDate)
      (where.date as Prisma.DateTimeFilter).lte = new Date(query.endDate);
  }

  const [entries, total] = await Promise.all([
    prisma.logbookEntry.findMany({
      where,
      include: {
        comments: { include: { supervisor: { include: { user: true } } } },
        assessments: { include: { lecturer: { include: { user: true } } } },
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.logbookEntry.count({ where }),
  ]);

  return {
    entries,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export interface LogbookInput {
  projectId: string;
  milestoneId: string;
  milestoneTaskId: string;
  title: string;
  description: string;
  activities: string;
  challenges?: string;
  learnings?: string;
  date: Date;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  attachments?: string[];
}

export async function createLogbookEntryForStudent(
  studentProfileId: string,
  data: LogbookInput,
) {
  const entry = await prisma.logbookEntry.create({
    data: {
      studentId: studentProfileId,
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      milestoneTaskId: data.milestoneTaskId,
      title: data.title,
      description: data.description,
      activities: data.activities,
      challenges: data.challenges,
      learnings: data.learnings,
      date: data.date,
      status: data.status,
      attachments: data.attachments,
      submittedAt: data.status === "PENDING" ? new Date() : undefined,
    },
    include: {
      comments: { include: { supervisor: { include: { user: true } } } },
      assessments: { include: { lecturer: { include: { user: true } } } },
    },
  });

  return entry;
}

export async function getLogbookEntryForStudent(
  studentProfileId: string,
  entryId: string,
) {
  return prisma.logbookEntry.findFirst({
    where: { id: entryId, studentId: studentProfileId },
    include: {
      comments: { include: { supervisor: { include: { user: true } } } },
      assessments: { include: { lecturer: { include: { user: true } } } },
    },
  });
}

export async function updateLogbookEntryForStudent(
  entryId: string,
  studentProfileId: string,
  data: Partial<LogbookInput>,
) {
  const updateData: Partial<LogbookInput & { submittedAt?: Date }> = {
    ...data,
  };
  if (data.status === "PENDING") updateData.submittedAt = new Date();
  const entry = await prisma.logbookEntry.update({
    where: { id: entryId },
    data: updateData,
    include: {
      comments: { include: { supervisor: { include: { user: true } } } },
      assessments: { include: { lecturer: { include: { user: true } } } },
    },
  });
  return entry;
}

export async function deleteLogbookEntryForStudent(entryId: string) {
  return prisma.logbookEntry.delete({ where: { id: entryId } });
}

export async function getProjectsForStudent(studentProfileId: string) {
  const projectAssignments = await prisma.projectLearner.findMany({
    where: { learnerId: studentProfileId },
    include: {
      project: {
        include: {
          milestones: {
            include: {
              tasks: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                  dueDate: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });

  return projectAssignments.map((assignment) => ({
    id: assignment.project.id,
    title: assignment.project.title,
    description: assignment.project.description,
    companyName: assignment.project.companyName,
    departmentId: assignment.project.departmentId,
    status: assignment.project.status,
    milestones: assignment.project.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      startDate: milestone.startDate,
      endDate: milestone.endDate,
      status: milestone.status,
      tasks: milestone.tasks,
    })),
  }));
}

export async function getStudentProfileData(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      department: true,
      supervisor: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      lecturer: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export interface StudentProfileUpdate {
  internshipCompany?: string;
  internshipStartDate?: Date | undefined;
  internshipEndDate?: Date | undefined;
}

export async function updateStudentProfileData(
  userId: string,
  data: StudentProfileUpdate,
) {
  return prisma.studentProfile.update({
    where: { userId },
    data: {
      internshipCompany: data.internshipCompany,
      internshipStartDate: data.internshipStartDate,
      internshipEndDate: data.internshipEndDate,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      department: true,
      supervisor: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      lecturer: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function getActiveAttendanceForStudent(studentProfileId: string) {
  const activeSession = await prisma.attendance.findFirst({
    where: { studentId: studentProfileId, status: "ACTIVE" },
    include: { officeLocation: true },
  });

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const todaySessions = await prisma.attendance.findMany({
    where: {
      studentId: studentProfileId,
      checkInTime: { gte: startOfDay, lte: endOfDay },
      OR: [{ status: "ACTIVE" }, { status: "COMPLETED" }],
    },
    include: { officeLocation: true },
    orderBy: { checkInTime: "asc" },
  });

  let todayTotalHours = todaySessions.reduce((sum, session) => {
    if (
      session.status === "COMPLETED" &&
      typeof session.hoursWorked === "number"
    )
      return sum + session.hoursWorked;
    return sum;
  }, 0);

  if (activeSession) {
    const now = new Date();
    const checkInTime = new Date(activeSession.checkInTime);
    const elapsedHours =
      (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    todayTotalHours += elapsedHours;
  }

  return {
    hasActiveSession: Boolean(activeSession),
    hasAttendanceToday: todaySessions.length > 0,
    activeSession,
    todaySessions,
    todayTotalHours: Math.round(todayTotalHours * 100) / 100,
    canCheckIn: !activeSession,
    canCheckOut: Boolean(activeSession),
  };
}
