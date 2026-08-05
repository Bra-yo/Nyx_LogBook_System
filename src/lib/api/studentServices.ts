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

export async function getActiveLearnerLearningPathsForUserId(userId: string) {
  return prisma.learnerLearningPath.findMany({
    where: { learnerId: userId, status: "ACTIVE" },
    include: {
      competency: {
        include: { learningArea: true },
      },
      mentorAllocations: {
        where: { status: "ACTIVE" },
        include: { mentor: { include: { user: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
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
        learningPath: {
          include: {
            competency: { include: { learningArea: true } },
            mentorAllocations: {
              where: { status: "ACTIVE" },
              include: { mentor: { include: { user: true } } },
            },
          },
        },
        project: true,
        milestone: true,
        milestoneTask: true,
        evidenceItems: true,
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

export interface LogbookEvidenceInput {
  type: "DOCUMENT" | "IMAGE" | "VIDEO" | "LINK" | "SOURCE_CODE";
  title?: string;
  url: string;
  description?: string;
}

export interface LogbookInput {
  learningPathId: string;
  projectId: string;
  milestoneId: string;
  milestoneTaskId: string;
  title: string;
  description: string;
  activities: string;
  hoursWorked?: number;
  challenges?: string;
  learnings?: string;
  date: Date;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  attachments?: string[];
  evidenceItems?: LogbookEvidenceInput[];
}

export async function createLogbookEntryForStudent(
  studentProfileId: string,
  data: LogbookInput,
) {
  const entry = await prisma.logbookEntry.create({
    data: {
      studentId: studentProfileId,
      learningPathId: data.learningPathId,
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      milestoneTaskId: data.milestoneTaskId,
      title: data.title,
      description: data.description,
      activities: data.activities,
      hoursWorked: data.hoursWorked,
      challenges: data.challenges,
      learnings: data.learnings,
      date: data.date,
      status: data.status,
      attachments: data.attachments,
      submittedAt: data.status === "PENDING" ? new Date() : undefined,
      evidenceItems: data.evidenceItems?.length
        ? {
            create: data.evidenceItems.map((item) => ({
              type: item.type,
              title: item.title,
              url: item.url,
              description: item.description,
            })),
          }
        : undefined,
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
      learningPath: {
        include: {
          competency: { include: { learningArea: true } },
          mentorAllocations: {
            where: { status: "ACTIVE" },
            include: { mentor: { include: { user: true } } },
          },
        },
      },
      project: true,
      milestone: true,
      milestoneTask: true,
      evidenceItems: true,
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

  const prismaUpdateData = {
    ...updateData,
  } as Prisma.LogbookEntryUpdateInput;

  if (data.evidenceItems) {
    prismaUpdateData.evidenceItems = {
      deleteMany: {},
      create: data.evidenceItems.map((item) => ({
        type: item.type,
        title: item.title,
        url: item.url,
        description: item.description,
      })),
    } as Prisma.LogbookEntryEvidenceCreateNestedManyWithoutLogbookEntryInput;
  }

  const entry = await prisma.logbookEntry.update({
    where: { id: entryId },
    data: prismaUpdateData,
    include: {
      comments: { include: { supervisor: { include: { user: true } } } },
      assessments: { include: { lecturer: { include: { user: true } } } },
      learningPath: {
        include: {
          competency: { include: { learningArea: true } },
          mentorAllocations: {
            where: { status: "ACTIVE" },
            include: { mentor: { include: { user: true } } },
          },
        },
      },
      evidenceItems: true,
    },
  });
  return entry;
}

export async function deleteLogbookEntryForStudent(entryId: string) {
  return prisma.logbookEntry.delete({ where: { id: entryId } });
}

type ProjectAssignmentWithRelations = Prisma.ProjectLearnerGetPayload<{
  include: {
    project: {
      include: {
        mentor: { include: { user: true } };
        department: true;
        milestones: {
          include: {
            tasks: {
              select: {
                id: true;
                title: true;
                description: true;
                status: true;
                dueDate: true;
                createdAt: true;
              };
            };
            entries: {
              where: { studentId: string };
              select: { id: true; title: true; status: true; createdAt: true; date: true };
            };
          };
          orderBy: { startDate: "desc" };
        };
        tasks: {
          select: {
            id: true;
            taskTitle: true;
            status: true;
            priority: true;
            createdAt: true;
            completedAt: true;
            expectedEndDate: true;
          };
        };
        LogbookEntry: {
          where: { studentId: string };
          select: { id: true; title: true; status: true; createdAt: true; date: true; hoursWorked: true };
        };
      };
    };
    learner: {
      include: {
        user: true;
        department: true;
      };
    };
  };
}>;

export async function getProjectsForStudent(studentProfileId: string) {
  const projectAssignments = await prisma.projectLearner.findMany({
    where: { learnerId: studentProfileId },
    include: {
      project: {
        include: {
          mentor: { include: { user: true } },
          department: true,
          milestones: {
            include: {
              tasks: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                  dueDate: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "asc" },
              },
              entries: {
                where: { studentId: studentProfileId },
                select: { id: true, title: true, status: true, createdAt: true, date: true },
              },
            },
            orderBy: { startDate: "desc" },
          },
          tasks: {
            select: {
              id: true,
              taskTitle: true,
              status: true,
              priority: true,
              createdAt: true,
              completedAt: true,
              expectedEndDate: true,
            },
            orderBy: { createdAt: "asc" },
          },
          LogbookEntry: {
            where: { studentId: studentProfileId },
            select: { id: true, title: true, status: true, createdAt: true, date: true, hoursWorked: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      learner: {
        include: {
          user: true,
          department: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  }) as ProjectAssignmentWithRelations[];

  return projectAssignments.map((assignment) => {
    const milestones = assignment.project.milestones ?? [];
    const allTasks = milestones.flatMap((milestone) => milestone.tasks);
    const completedMilestones = milestones.filter((milestone) => milestone.status === "COMPLETED").length;
    const completedTasks = allTasks.filter((task) => task.status === "COMPLETED").length;
    const totalTasks = allTasks.length;
    const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const latestActivity = [...assignment.project.LogbookEntry, ...milestones.flatMap((milestone) => milestone.entries)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      id: assignment.project.id,
      title: assignment.project.title,
      description: assignment.project.description,
      companyName: assignment.project.companyName,
      departmentId: assignment.project.departmentId,
      status: assignment.project.status,
      createdAt: assignment.project.createdAt,
      updatedAt: assignment.project.updatedAt,
      completionPercentage,
      completedMilestones,
      completedTasks,
      totalTasks,
      mentor: assignment.project.mentor ? { id: assignment.project.mentor.id, name: assignment.project.mentor.user.name } : null,
      learningArea: assignment.learner.department ? { name: assignment.learner.department.name } : null,
      milestones: milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        startDate: milestone.startDate,
        endDate: milestone.endDate,
        status: milestone.status,
        tasks: milestone.tasks,
        evidenceCount: milestone.entries.length,
      })),
      recentLogbooks: assignment.project.LogbookEntry,
      latestActivity,
    };
  });
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
