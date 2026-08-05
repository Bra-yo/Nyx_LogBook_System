export interface StudentLearningAreaResolutionResult {
  ok: boolean
  learningAreaId?: string
  error?: string
}

export function resolveStudentLearningAreaId(input: {
  role?: string
  learningAreaId?: string | null
}): StudentLearningAreaResolutionResult {
  if (input.role !== 'STUDENT') {
    return { ok: true }
  }

  const trimmed = input.learningAreaId?.trim()
  if (!trimmed) {
    return {
      ok: false,
      error: 'Learning area is required for learner accounts',
    }
  }

  return { ok: true, learningAreaId: trimmed }
}
