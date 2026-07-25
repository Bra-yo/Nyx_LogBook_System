export type MentorRiskStatus = "GREEN" | "AMBER" | "RED";

interface MentorLearnerData {
  learner: {
    id: string;
    createdAt: Date;
    cohort?: { startDate?: Date | null } | null;
  };
  attendanceRecords: Array<{ status?: string | null }>;
  milestones: Array<{ status?: string | null }>;
  milestoneTasks: Array<{ status?: string | null }>;
  logbookEntries: Array<{ status?: string | null }>;
  weeklyReviews: Array<{ competencyLevel?: number | null }>;
  projectLearners: Array<unknown>;
}

export interface MentorLearnerPerformance {
  learnerId: string;
  attendancePercentage: number;
  taskCompletionPercentage: number;
  worklogCompletionPercentage: number;
  competencyProgressPercentage: number;
  overallProgress: number;
  riskStatus: MentorRiskStatus;
  completedTasks: number;
  pendingTasks: number;
  completedWorklogs: number;
  pendingWorklogs: number;
  competenciesAchieved: number;
  competenciesInProgress: number;
  activeProjects: number;
  daysSinceStart: number;
}

export interface MentorDashboardSummary {
  totalAssignedMentees: number;
  activeMentees: number;
  upcomingMentorshipSessions: number;
  pendingReviews: number;
  averageAttendance: number;
  averageTaskCompletion: number;
  averageWorklogCompletion: number;
  averageCompetencyProgress: number;
  overallProgressAverage: number;
}

export function getRiskStatus(input: {
  attendancePercentage: number;
  taskCompletionPercentage: number;
  worklogCompletionPercentage: number;
  competencyProgressPercentage: number;
  overallProgress: number;
}): MentorRiskStatus {
  const lowPerformance = [
    input.attendancePercentage,
    input.taskCompletionPercentage,
    input.worklogCompletionPercentage,
    input.competencyProgressPercentage,
    input.overallProgress,
  ].some((value) => value <= 20);

  const warning = [
    input.attendancePercentage,
    input.taskCompletionPercentage,
    input.worklogCompletionPercentage,
    input.competencyProgressPercentage,
    input.overallProgress,
  ].some((value) => value <= 60);

  if (lowPerformance) {
    return "RED";
  }

  if (warning) {
    return "AMBER";
  }

  return "GREEN";
}

export function buildMentorLearnerPerformance(input: MentorLearnerData): MentorLearnerPerformance {
  const completedAttendance = input.attendanceRecords.filter((item) => item.status === "COMPLETED").length;
  const attendancePercentage = input.attendanceRecords.length > 0
    ? Math.round((completedAttendance / input.attendanceRecords.length) * 100)
    : 0;

  const completedTasks = input.milestoneTasks.filter((item) => item.status === "COMPLETED").length;
  const pendingTasks = input.milestoneTasks.length - completedTasks;
  const taskCompletionPercentage = input.milestoneTasks.length > 0
    ? Math.round((completedTasks / input.milestoneTasks.length) * 100)
    : 0;

  const approvedWorklogs = input.logbookEntries.filter((item) => item.status === "APPROVED").length;
  const pendingWorklogs = input.logbookEntries.length - approvedWorklogs;
  const worklogCompletionPercentage = input.logbookEntries.length > 0
    ? Math.round((approvedWorklogs / input.logbookEntries.length) * 100)
    : 0;

  const completedMilestones = input.milestones.filter((item) => item.status === "COMPLETED").length;
  const inProgressMilestones = input.milestones.filter((item) => item.status === "IN_PROGRESS").length;
  const competencyProgressPercentage = input.milestones.length > 0
    ? Math.round((completedMilestones / input.milestones.length) * 100)
    : 0;

  const overallProgress = Math.round(
    (attendancePercentage * 0.3) +
    (taskCompletionPercentage * 0.3) +
    (worklogCompletionPercentage * 0.2) +
    (competencyProgressPercentage * 0.2),
  );

  const riskStatus = getRiskStatus({
    attendancePercentage,
    taskCompletionPercentage,
    worklogCompletionPercentage,
    competencyProgressPercentage,
    overallProgress,
  });

  const startDate = input.learner.cohort?.startDate ?? input.learner.createdAt;
  const daysSinceStart = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    learnerId: input.learner.id,
    attendancePercentage,
    taskCompletionPercentage,
    worklogCompletionPercentage,
    competencyProgressPercentage,
    overallProgress,
    riskStatus,
    completedTasks,
    pendingTasks,
    completedWorklogs: approvedWorklogs,
    pendingWorklogs,
    competenciesAchieved: completedMilestones,
    competenciesInProgress: inProgressMilestones,
    activeProjects: input.projectLearners.length,
    daysSinceStart,
  };
}

export function buildMentorDashboardSummary(performances: MentorLearnerPerformance[]): MentorDashboardSummary {
  const totalAssignedMentees = performances.length;
  const activeMentees = performances.filter((performance) => performance.overallProgress >= 60).length;

  const averageAttendance = totalAssignedMentees > 0
    ? Math.round(performances.reduce((sum, performance) => sum + performance.attendancePercentage, 0) / totalAssignedMentees)
    : 0;
  const averageTaskCompletion = totalAssignedMentees > 0
    ? Math.round(performances.reduce((sum, performance) => sum + performance.taskCompletionPercentage, 0) / totalAssignedMentees)
    : 0;
  const averageWorklogCompletion = totalAssignedMentees > 0
    ? Math.round(performances.reduce((sum, performance) => sum + performance.worklogCompletionPercentage, 0) / totalAssignedMentees)
    : 0;
  const averageCompetencyProgress = totalAssignedMentees > 0
    ? Math.round(performances.reduce((sum, performance) => sum + performance.competencyProgressPercentage, 0) / totalAssignedMentees)
    : 0;
  const overallProgressAverage = totalAssignedMentees > 0
    ? Math.round(performances.reduce((sum, performance) => sum + performance.overallProgress, 0) / totalAssignedMentees)
    : 0;

  return {
    totalAssignedMentees,
    activeMentees,
    upcomingMentorshipSessions: 0,
    pendingReviews: 0,
    averageAttendance,
    averageTaskCompletion,
    averageWorklogCompletion,
    averageCompetencyProgress,
    overallProgressAverage,
  };
}
