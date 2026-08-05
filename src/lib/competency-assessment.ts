export type CompetencyLevel =
  | 'NOT_YET_DEMONSTRATED'
  | 'EMERGING'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'EXPERT'

export type CompetencyAssessmentStatus = 'DRAFT' | 'SUBMITTED' | 'FINAL'

export interface AssessmentRecordLike {
  id?: string
  score?: number | null
  level?: string | null
  status?: CompetencyAssessmentStatus | null
  assessmentDate?: string | Date | null
  comments?: string | null
  evidence?: string | null
  learnerLearningPathId?: string | null
  learnerLearningPath?: {
    competency?: { name?: string | null; code?: string | null } | null
  } | null
  assessedBySupervisor?: { user?: { name?: string | null } | null } | null
  assessedByAdmin?: { user?: { name?: string | null } | null } | null
}

export const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  NOT_YET_DEMONSTRATED: 'Not Yet Demonstrated',
  EMERGING: 'Emerging',
  COMPETENT: 'Competent',
  PROFICIENT: 'Proficient',
  EXPERT: 'Expert',
}

export function resolveCompetencyLevel(score: number): CompetencyLevel {
  if (score <= 1) return 'NOT_YET_DEMONSTRATED'
  if (score === 2) return 'EMERGING'
  if (score === 3) return 'COMPETENT'
  if (score === 4) return 'PROFICIENT'
  return 'EXPERT'
}

export function getCompetencyLevelLabel(score: number | null | undefined): string {
  if (!score) return 'Not Assessed'
  return COMPETENCY_LEVEL_LABELS[resolveCompetencyLevel(score)]
}

export function getCompetencyLevelStars(score: number | null | undefined): string {
  if (!score) return '☆☆☆☆☆'
  const filled = Math.min(5, Math.max(0, score))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export function getCompetencyAssessmentStatusLabel(status: CompetencyAssessmentStatus | null | undefined): string {
  switch (status) {
    case 'SUBMITTED':
      return 'Submitted'
    case 'FINAL':
      return 'Final'
    case 'DRAFT':
    default:
      return 'Draft'
  }
}

export function getLatestAssessment<T extends AssessmentRecordLike>(assessments: T[] | null | undefined) {
  const finalAssessments = (assessments ?? []).filter((assessment) => assessment.status === 'FINAL')
  if (finalAssessments.length === 0) {
    return null
  }

  return [...finalAssessments].sort((left, right) => new Date(right.assessmentDate ?? 0).getTime() - new Date(left.assessmentDate ?? 0).getTime())[0] ?? null
}

export function getCurrentCompetencyLevel(assessments: AssessmentRecordLike[] | null | undefined): CompetencyLevel | 'NOT_ASSESSED' {
  const latest = getLatestAssessment(assessments)
  if (!latest?.score) {
    return 'NOT_ASSESSED'
  }

  return resolveCompetencyLevel(latest.score)
}

export function getAssessmentTimeline<T extends AssessmentRecordLike>(assessments: T[] | null | undefined): T[] {
  return [...(assessments ?? [])].sort((left, right) => new Date(right.assessmentDate ?? 0).getTime() - new Date(left.assessmentDate ?? 0).getTime())
}

export function getFinalAssessments<T extends AssessmentRecordLike>(assessments: T[] | null | undefined): T[] {
  return (assessments ?? []).filter((assessment) => assessment.status === 'FINAL')
}

export function getAssessmentStatusCounts(assessments: AssessmentRecordLike[] | null | undefined) {
  const counts = {
    DRAFT: 0,
    SUBMITTED: 0,
    FINAL: 0,
  }

  for (const assessment of assessments ?? []) {
    if (assessment.status && counts[assessment.status as CompetencyAssessmentStatus] !== undefined) {
      counts[assessment.status as CompetencyAssessmentStatus] += 1
    }
  }

  return counts
}

export function getAverageCompetencyScore(assessments: AssessmentRecordLike[] | null | undefined) {
  const latest = getLatestAssessment(assessments)
  if (typeof latest?.score !== 'number') {
    return null
  }

  return latest.score
}

export function getAverageCompetencyLevel(assessments: AssessmentRecordLike[] | null | undefined) {
  const averageScore = getAverageCompetencyScore(assessments)
  if (averageScore === null) {
    return 'NOT_ASSESSED'
  }

  return resolveCompetencyLevel(Math.round(averageScore))
}

export function getProgressPercentage(assessments: AssessmentRecordLike[] | null | undefined, totalLearningPaths: number) {
  if (totalLearningPaths === 0) {
    return 0
  }

  const finalAssessments = getFinalAssessments(assessments)
  const uniquePaths = new Set(finalAssessments.map((assessment) => assessment.learnerLearningPathId).filter(Boolean))
  return Math.round((uniquePaths.size / totalLearningPaths) * 100)
}

export function getHighestAssessment(assessments: AssessmentRecordLike[] | null | undefined) {
  return getFinalAssessments(assessments).sort(
    (left, right) =>
      (right.score ?? 0) - (left.score ?? 0) ||
      new Date(right.assessmentDate ?? 0).getTime() - new Date(left.assessmentDate ?? 0).getTime(),
  )[0] ?? null
}

export function getAssessmentSummary(assessments: AssessmentRecordLike[] | null | undefined) {
  const latest = getLatestAssessment(assessments)
  const latestAssessmentDate = latest?.assessmentDate
    ? new Date(latest.assessmentDate).toISOString().slice(0, 10)
    : 'Not Assessed'

  return {
    currentScore: latest?.score ?? null,
    currentLevel: latest?.score ? resolveCompetencyLevel(latest.score) : 'NOT_ASSESSED',
    latestAssessmentDate,
    latestAssessment: latest ?? null,
  }
}
