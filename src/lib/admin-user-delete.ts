import type { Prisma } from "@prisma/client";

export type TransactionClient = Prisma.TransactionClient;

export type DeleteUserContext = {
  id: string;
  role: string;
  studentProfile?: { id: string } | null;
  supervisorProfile?: { id: string } | null;
  lecturerProfile?: { id: string } | null;
  adminProfile?: { id: string } | null;
  workerProfile?: { id: string } | null;
};

export async function deleteUserPermanently(
  tx: TransactionClient,
  userId: string,
  role: string,
  existingUser?: DeleteUserContext | null,
) {
  const user =
    existingUser ??
    (await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        studentProfile: { select: { id: true } },
        supervisorProfile: { select: { id: true } },
        lecturerProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
        workerProfile: { select: { id: true } },
      },
    }));

  if (!user) {
    throw new Error("User not found");
  }

  await Promise.all([
    tx.auditLog.deleteMany({ where: { userId } }),
    tx.notification.deleteMany({ where: { userId } }),
    tx.session.deleteMany({ where: { userId } }),
  ]);

  const roleCleanupOperations: Promise<unknown>[] = [];

  if (role === "STUDENT") {
    roleCleanupOperations.push(
      tx.weeklyMentorTaskReview.deleteMany({
        where: { learnerId: user.studentProfile?.id ?? "" },
      }),
    );
  }

  if (role === "SUPERVISOR") {
    roleCleanupOperations.push(
      tx.supervisorComment.deleteMany({
        where: { supervisorId: user.supervisorProfile?.id ?? "" },
      }),
      tx.milestoneMentorAssessment.deleteMany({
        where: { mentorId: user.supervisorProfile?.id ?? "" },
      }),
      tx.weeklyMentorTaskReview.deleteMany({
        where: { mentorId: user.supervisorProfile?.id ?? "" },
      }),
      tx.officeLocation.updateMany({
        where: { mentorId: user.supervisorProfile?.id ?? "" },
        data: { mentorId: null },
      }),
      tx.milestone.updateMany({
        where: { mentorId: user.supervisorProfile?.id ?? "" },
        data: { mentorId: null },
      }),
      tx.project.updateMany({
        where: {
          OR: [
            { mentorId: user.supervisorProfile?.id ?? "" },
            { supervisorId: user.supervisorProfile?.id ?? "" },
          ],
        },
        data: {
          mentorId: null,
          supervisorId: null,
        },
      }),
      tx.taskWorkLog.updateMany({
        where: { reviewedBy: user.supervisorProfile?.id ?? "" },
        data: { reviewedBy: null },
      }),
    );
  }

  if (role === "LECTURER") {
    roleCleanupOperations.push(
      tx.lecturerAssessment.deleteMany({
        where: { lecturerId: user.lecturerProfile?.id ?? "" },
      }),
      tx.milestoneLecturerAssessment.deleteMany({
        where: { lecturerId: user.lecturerProfile?.id ?? "" },
      }),
      tx.studentProfile.updateMany({
        where: { lecturerId: user.lecturerProfile?.id ?? "" },
        data: { lecturerId: null },
      }),
    );
  }

  if (role === "WORKER") {
    roleCleanupOperations.push(
      tx.projectMember.deleteMany({
        where: { workerId: user.workerProfile?.id ?? "" },
      }),
      tx.task.updateMany({
        where: { assignedWorkerId: user.workerProfile?.id ?? "" },
        data: { assignedWorkerId: null },
      }),
    );
  }

  if (roleCleanupOperations.length > 0) {
    await Promise.all(roleCleanupOperations);
  }

  if (role === "STUDENT") {
    await tx.studentProfile
      .delete({ where: { userId } })
      .catch(() => undefined);
  }

  if (role === "SUPERVISOR") {
    await tx.supervisorProfile
      .delete({ where: { userId } })
      .catch(() => undefined);
  }

  if (role === "LECTURER") {
    await tx.lecturerProfile
      .delete({ where: { userId } })
      .catch(() => undefined);
  }

  if (role === "ADMIN") {
    await tx.adminProfile.delete({ where: { userId } }).catch(() => undefined);
  }

  if (role === "WORKER") {
    await tx.workerProfile.delete({ where: { userId } }).catch(() => undefined);
  }

  await tx.user.delete({ where: { id: userId } });
}
