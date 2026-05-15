import type { SupervisorProfile, LecturerProfile, StudentProfile } from '@prisma/client'

export function normalizeCompanyName(value?: string | null) {
  return value?.trim().toLowerCase() || ''
}

export function canMentorAccessLearner(mentorProfile: SupervisorProfile, learnerProfile: StudentProfile) {
  const mentorCompany = normalizeCompanyName(mentorProfile.company)
  const learnerCompany = normalizeCompanyName(learnerProfile.internshipCompany)

  if (!mentorCompany || !learnerCompany) {
    return false
  }

  return mentorCompany === learnerCompany
}

export function buildMentorProjectWhereClause(mentorProfile: SupervisorProfile) {
  const companyName = normalizeCompanyName(mentorProfile.company)
  const where: any = {
    OR: [
      { mentorId: mentorProfile.id }
    ]
  }

  if (companyName) {
    where.OR.push({ companyName })
  }

  return where
}

export function buildLecturerLearnerWhereClause(lecturerProfile: LecturerProfile) {
  if (!lecturerProfile.departmentId) {
    return { id: { equals: '' } }
  }

  return {
    departmentId: lecturerProfile.departmentId
  }
}
