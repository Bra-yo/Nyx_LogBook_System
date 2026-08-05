import type { CurriculumPackage } from './types'

export const informationTechnologyCurriculum: CurriculumPackage = {
  id: 'information-technology',
  name: 'Information Technology',
  description: 'IT support and operational readiness curriculum.',
  learningArea: {
    name: 'Information Technology',
    code: 'IT',
    description: 'IT support and digital operations curriculum.',
    status: 'ACTIVE',
    displayOrder: 3,
  },
  competencies: [
    {
      name: 'IT Support',
      code: 'IT-COMP-001',
      description: 'Support end-users and resolve service requests.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Troubleshooting', code: 'IT-COMP-001-G1', description: 'Issue investigation workflows.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Service Desk', code: 'IT-COMP-001-G2', description: 'Ticket and request handling.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
