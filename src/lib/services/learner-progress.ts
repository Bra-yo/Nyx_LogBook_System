export interface LearnerProgressCounts {
  attendanceRecords: number;
  ProjectLearner: number;
  logbookEntries: number;
  assessments: number;
  Milestone: number;
  WeeklyMentorTaskReview?: number;
}

export function buildLearnerProgress(
  user: { bio: string | null; skills: string[] },
  counts: LearnerProgressCounts,
) {
  return {
    portfolio: Boolean(user.bio || user.skills.length),
    attendance: counts.attendanceRecords,
    projects: counts.ProjectLearner,
    workRecords: counts.logbookEntries,
    reports: counts.assessments,
    weeklyReviews: counts.WeeklyMentorTaskReview ?? 0,
    milestones: counts.Milestone,
  };
}