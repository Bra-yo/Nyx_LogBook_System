export interface AnalyticsTrendSummary {
  label: string;
  value: number;
}

export interface LearnerAnalyticsInput {
  learningPaths?: Array<{ status?: string | null; competency?: { name?: string | null } | null }>;
  assessments?: Array<{ status?: string | null; score?: number | null; assessmentDate?: string | Date | null }>;
  logbookEntries?: Array<{ status?: string | null; hoursWorked?: number | null }>;
  evidenceItems?: Array<unknown>;
  projects?: Array<{ status?: string | null; milestones?: Array<{ status?: string | null; tasks?: Array<{ status?: string | null }> }> }>;
  pendingReviews?: number;
}

export interface LearnerAnalyticsSnapshot {
  currentLearningPath: string;
  competencyCompletion: number;
  projectsCompleted: number;
  milestonesCompleted: number;
  tasksCompleted: number;
  hoursLogged: number;
  evidenceSubmitted: number;
  portfolioCompletion: number;
  averageAssessmentScore: number;
  pendingReviews: number;
  trend: AnalyticsTrendSummary;
}

export interface CompetencyAnalyticsSnapshot {
  completed: number;
  inProgress: number;
  averageScore: number;
  growthRate: number;
  highest: Array<{ name: string; score: number }>;
  weakest: Array<{ name: string; score: number }>;
  distribution: Array<{ label: string; value: number }>;
}

export interface ProjectAnalyticsSnapshot {
  completionRate: number;
  averageDurationDays: number;
  milestoneCompletionRate: number;
  taskCompletionRate: number;
  evidencePerProject: number;
  byCompetency: Array<{ label: string; value: number }>;
  byLearningArea: Array<{ label: string; value: number }>;
}

export interface MentorAnalyticsSnapshot {
  assignedLearners: number;
  activeLearningPaths: number;
  pendingReviews: number;
  completedReviews: number;
  assessmentCompletionRate: number;
  averageLearnerGrowth: number;
  projectsSupervised: number;
  workload: number;
  capacityUtilization: number;
}

export interface AdminAnalyticsSnapshot {
  learners: number;
  mentors: number;
  projects: number;
  learningAreas: number;
  competencies: number;
  learningPaths: number;
  assessments: number;
  logbooks: number;
  evidence: number;
  portfolioCompletion: number;
  averageCompetencyScore: number;
  completionRate: number;
  recentActivity: Array<{ title: string; detail: string }>;
}

export interface OrganizationInsight {
  label: string;
  value: string;
}

export interface AtRiskLearnerInsight {
  learnerName: string;
  warning: string;
  suggestedIntervention: string;
}

export interface LearningPathInsight {
  name: string;
  completionRate: number;
  averageCompetencyScore: number;
  averagePortfolioCompletion: number;
}

export function buildTrendIndicator(current: number, previous: number) {
  if (current > previous) return "↑ Improving";
  if (current < previous) return "↓ Needs Attention";
  return "→ Stable";
}

export function buildLearnerAnalyticsSnapshot(input: LearnerAnalyticsInput): LearnerAnalyticsSnapshot {
  const learningPaths = input.learningPaths ?? [];
  const completedLearningPaths = learningPaths.filter((path) => path.status === "COMPLETED").length;
  const competencyCompletion = learningPaths.length > 0 ? Math.round((completedLearningPaths / learningPaths.length) * 100) : 0;

  const completedProjects = (input.projects ?? []).filter((project) => project.status === "COMPLETED").length;
  const completedMilestones = (input.projects ?? []).flatMap((project) => project.milestones ?? []).filter((milestone) => milestone.status === "COMPLETED").length;
  const completedTasks = (input.projects ?? []).flatMap((project) => project.milestones ?? []).flatMap((milestone) => milestone.tasks ?? []).filter((task) => task.status === "COMPLETED").length;

  const finalAssessments = (input.assessments ?? []).filter((assessment) => assessment.status === "FINAL");
  const averageAssessmentScore = finalAssessments.length > 0 ? Math.round((finalAssessments.reduce((sum, assessment) => sum + (assessment.score ?? 0), 0) / finalAssessments.length) * 10) / 10 : 0;

  const hoursLogged = (input.logbookEntries ?? []).reduce((sum, entry) => sum + (entry.hoursWorked ?? 0), 0);
  const evidenceSubmitted = (input.evidenceItems ?? []).length;
  const pendingReviews = input.pendingReviews ?? 0;
  const portfolioCompletion = completedProjects > 0 ? 100 : 0;
  const trend = {
    label: buildTrendIndicator(competencyCompletion, 0),
    value: competencyCompletion,
  };

  return {
    currentLearningPath: learningPaths[0]?.competency?.name ?? "No active path",
    competencyCompletion,
    projectsCompleted: completedProjects,
    milestonesCompleted: completedMilestones,
    tasksCompleted: completedTasks,
    hoursLogged,
    evidenceSubmitted,
    portfolioCompletion,
    averageAssessmentScore,
    pendingReviews,
    trend,
  };
}

export function buildCompetencyAnalyticsSnapshot(assessments: Array<{ score?: number | null; status?: string | null; learnerLearningPath?: { competency?: { name?: string | null } | null } | null }> = []): CompetencyAnalyticsSnapshot {
  const finalAssessments = assessments.filter((assessment) => assessment.status === "FINAL");
  const averageScore = finalAssessments.length > 0 ? Math.round((finalAssessments.reduce((sum, assessment) => sum + (assessment.score ?? 0), 0) / finalAssessments.length) * 10) / 10 : 0;
  const completed = finalAssessments.filter((assessment) => (assessment.score ?? 0) >= 3).length;
  const inProgress = Math.max(0, finalAssessments.length - completed);
  const growthRate = finalAssessments.length > 1 ? Math.round(((averageScore - 1) / Math.max(1, finalAssessments.length)) * 10) : 0;
  const distribution = [1, 2, 3, 4, 5].map((level) => ({
    label: `${level}`,
    value: finalAssessments.filter((assessment) => (assessment.score ?? 0) === level).length,
  }));

  const ranked = finalAssessments
    .map((assessment) => ({
      name: assessment.learnerLearningPath?.competency?.name ?? "Untitled competency",
      score: assessment.score ?? 0,
    }))
    .sort((left, right) => right.score - left.score);

  return {
    completed,
    inProgress,
    averageScore,
    growthRate,
    highest: ranked.slice(0, 3),
    weakest: ranked.slice(-3).reverse(),
    distribution,
  };
}

export function buildProjectAnalyticsSnapshot(projects: Array<{ status?: string | null; createdAt?: Date | string | null; updatedAt?: Date | string | null; milestones?: Array<{ status?: string | null; tasks?: Array<{ status?: string | null }> }> | null; competency?: { name?: string | null } | null; learningArea?: { name?: string | null } | null }> = []): ProjectAnalyticsSnapshot {
  const completedProjects = projects.filter((project) => project.status === "COMPLETED").length;
  const completionRate = projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0;
  const averageDurationDays = projects.length > 0 ? Math.round(projects.reduce((sum, project) => {
    if (!project.createdAt || !project.updatedAt) return sum;
    return sum + (new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }, 0) / projects.length) : 0;

  const milestoneTasks = projects.flatMap((project) => project.milestones ?? []).flatMap((milestone) => milestone.tasks ?? []);
  const completedMilestones = projects.flatMap((project) => project.milestones ?? []).filter((milestone) => milestone.status === "COMPLETED").length;
  const totalMilestones = projects.flatMap((project) => project.milestones ?? []).length;
  const milestoneCompletionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const completedTasks = milestoneTasks.filter((task) => task.status === "COMPLETED").length;
  const taskCompletionRate = milestoneTasks.length > 0 ? Math.round((completedTasks / milestoneTasks.length) * 100) : 0;
  const evidencePerProject = projects.length > 0 ? Math.round((projects.length + completedProjects) / Math.max(1, projects.length)) : 0;

  const byCompetency = projects.reduce<Array<{ label: string; value: number }>>((result, project) => {
    const label = project.competency?.name ?? "Unassigned";
    const existing = result.find((item) => item.label === label);
    if (existing) existing.value += 1; else result.push({ label, value: 1 });
    return result;
  }, []);

  const byLearningArea = projects.reduce<Array<{ label: string; value: number }>>((result, project) => {
    const label = project.learningArea?.name ?? "Unassigned";
    const existing = result.find((item) => item.label === label);
    if (existing) existing.value += 1; else result.push({ label, value: 1 });
    return result;
  }, []);

  return {
    completionRate,
    averageDurationDays,
    milestoneCompletionRate,
    taskCompletionRate,
    evidencePerProject,
    byCompetency,
    byLearningArea,
  };
}

export function buildMentorAnalyticsSnapshot(allocations: Array<{ learningPath?: { assessments?: Array<{ status?: string | null; score?: number | null }> | null } | null }> = [], reviews: number = 0, projects: number = 0, learners: number = 0): MentorAnalyticsSnapshot {
  const activeLearningPaths = allocations.filter((allocation) => (allocation.learningPath?.assessments ?? []).length > 0).length;
  const assessmentCompletionRate = allocations.length > 0 ? Math.round((activeLearningPaths / allocations.length) * 100) : 0;
  const averageLearnerGrowth = allocations.length > 0 ? Math.round((activeLearningPaths + reviews) / Math.max(1, allocations.length)) : 0;
  const workload = Math.max(allocations.length, learners);
  const capacityUtilization = learners > 0 ? Math.round((workload / Math.max(1, learners)) * 100) : 0;

  return {
    assignedLearners: learners,
    activeLearningPaths,
    pendingReviews: Math.max(0, reviews - 1),
    completedReviews: reviews,
    assessmentCompletionRate,
    averageLearnerGrowth,
    projectsSupervised: projects,
    workload,
    capacityUtilization,
  };
}

export function buildAdminAnalyticsSnapshot(data: { learners: number; mentors: number; projects: number; learningAreas: number; competencies: number; learningPaths: number; assessments: number; logbooks: number; evidence: number; portfolioCompletion: number; averageCompetencyScore: number; completionRate: number; recentActivity?: Array<{ title: string; detail: string }> }): AdminAnalyticsSnapshot {
  return {
    learners: data.learners,
    mentors: data.mentors,
    projects: data.projects,
    learningAreas: data.learningAreas,
    competencies: data.competencies,
    learningPaths: data.learningPaths,
    assessments: data.assessments,
    logbooks: data.logbooks,
    evidence: data.evidence,
    portfolioCompletion: data.portfolioCompletion,
    averageCompetencyScore: data.averageCompetencyScore,
    completionRate: data.completionRate,
    recentActivity: data.recentActivity ?? [],
  };
}

export function buildOrganizationInsights(items: Array<{ label: string; value: string }>): OrganizationInsight[] {
  return items.map((item) => ({ label: item.label, value: item.value }));
}

export function buildAtRiskLearnerDetections(learners: Array<{ learnerName: string; warnings: string[]; suggestedIntervention: string }>): AtRiskLearnerInsight[] {
  return learners.filter((learner) => learner.warnings.length > 0).map((learner) => ({
    learnerName: learner.learnerName,
    warning: learner.warnings.join(", "),
    suggestedIntervention: learner.suggestedIntervention,
  }));
}

export function buildLearningPathInsights(paths: Array<{ name: string; completionRate: number; averageCompetencyScore: number; averagePortfolioCompletion: number }>): LearningPathInsight[] {
  return paths.map((path) => ({
    name: path.name,
    completionRate: path.completionRate,
    averageCompetencyScore: path.averageCompetencyScore,
    averagePortfolioCompletion: path.averagePortfolioCompletion,
  }));
}
