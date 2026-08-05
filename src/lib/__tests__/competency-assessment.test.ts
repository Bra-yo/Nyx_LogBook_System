import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveCompetencyLevel, getCompetencyLevelLabel, getCompetencyLevelStars, getCompetencyAssessmentStatusLabel } from '../competency-assessment'

test('maps numeric scores to the expected semantic levels', () => {
  assert.equal(resolveCompetencyLevel(1), 'NOT_YET_DEMONSTRATED')
  assert.equal(resolveCompetencyLevel(3), 'COMPETENT')
  assert.equal(resolveCompetencyLevel(5), 'EXPERT')
})

test('returns a display label and star summary for a score', () => {
  assert.equal(getCompetencyLevelLabel(4), 'Proficient')
  assert.equal(getCompetencyLevelStars(4), '★★★★☆')
})

test('returns a friendly label for assessment statuses', () => {
  assert.equal(getCompetencyAssessmentStatusLabel('DRAFT'), 'Draft')
  assert.equal(getCompetencyAssessmentStatusLabel('FINAL'), 'Final')
})
