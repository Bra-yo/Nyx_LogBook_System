import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAssessmentSummary,
  getAssessmentTimeline,
  getCurrentCompetencyLevel,
  getLatestAssessment,
  getAssessmentStatusCounts,
  getAverageCompetencyScore,
  getHighestAssessment,
  type AssessmentRecordLike,
} from '../competency-assessment'

test('derives the latest final assessment and summary from a timeline', () => {
  const assessments: AssessmentRecordLike[] = [
    {
      id: 'a-1',
      score: 2,
      level: 'EMERGING',
      status: 'FINAL',
      assessmentDate: '2026-01-10T00:00:00.000Z',
      comments: 'Needs support',
      evidence: 'Sample',
      assessedBySupervisor: { user: { name: 'Jane' } },
    },
    {
      id: 'a-2',
      score: 4,
      level: 'PROFICIENT',
      status: 'FINAL',
      assessmentDate: '2026-02-12T00:00:00.000Z',
      comments: 'Strong progress',
      evidence: 'Portfolio',
      assessedByAdmin: { user: { name: 'Admin 1' } },
    },
  ]

  const latest = getLatestAssessment(assessments)
  const timeline = getAssessmentTimeline(assessments)
  const summary = getAssessmentSummary(assessments)
  const current = getCurrentCompetencyLevel(assessments)

  assert.equal(latest?.id, 'a-2')
  assert.equal(timeline.length, 2)
  assert.equal(summary.currentScore, 4)
  assert.equal(summary.currentLevel, 'PROFICIENT')
  assert.equal(summary.latestAssessmentDate, '2026-02-12')
  assert.equal(current, 'PROFICIENT')
  assert.deepEqual(getAssessmentStatusCounts(assessments), { DRAFT: 0, SUBMITTED: 0, FINAL: 2 })
  assert.equal(getAverageCompetencyScore(assessments), 4)
  assert.equal(getHighestAssessment(assessments)?.id, 'a-2')
})

test('returns not assessed values when no final assessment exists', () => {
  const summary = getAssessmentSummary([])
  assert.equal(summary.currentScore, null)
  assert.equal(summary.currentLevel, 'NOT_ASSESSED')
  assert.equal(summary.latestAssessmentDate, 'Not Assessed')
  assert.deepEqual(getAssessmentStatusCounts([]), { DRAFT: 0, SUBMITTED: 0, FINAL: 0 })
  assert.equal(getAverageCompetencyScore([]), null)
  assert.equal(getHighestAssessment([]), null)
})
