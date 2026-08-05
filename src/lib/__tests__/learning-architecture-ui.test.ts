import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDisplayDate, toDateInputValue, toApiDateValue } from '../learning-architecture-ui'

test('formatDisplayDate returns a friendly label for empty values', () => {
  assert.equal(formatDisplayDate(null), 'Not set')
  assert.equal(formatDisplayDate(''), 'Not set')
})

test('toDateInputValue and toApiDateValue round-trip dates correctly', () => {
  const input = '2026-07-30'
  assert.equal(toDateInputValue(new Date('2026-07-30T00:00:00.000Z')), input)
  assert.deepEqual(toApiDateValue(input), new Date('2026-07-30T00:00:00.000Z'))
})
