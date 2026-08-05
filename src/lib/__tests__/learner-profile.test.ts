import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveStudentLearningAreaId } from '../learner-profile'

test('allows non-student roles without a learning area', () => {
  const result = resolveStudentLearningAreaId({ role: 'SUPERVISOR' })

  assert.equal(result.ok, true)
  assert.equal(result.learningAreaId, undefined)
})

test('accepts a provided learning area for student accounts', () => {
  const result = resolveStudentLearningAreaId({ role: 'STUDENT', learningAreaId: 'area-1' })

  assert.equal(result.ok, true)
  assert.equal(result.learningAreaId, 'area-1')
})

test('rejects student accounts without a learning area', () => {
  const result = resolveStudentLearningAreaId({ role: 'STUDENT' })

  assert.equal(result.ok, false)
  assert.equal(result.error, 'Learning area is required for learner accounts')
})
