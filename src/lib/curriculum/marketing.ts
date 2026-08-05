import type { CurriculumPackage } from './types'

export const marketingCurriculum: CurriculumPackage = {
  id: 'marketing',
  name: 'Marketing',
  description: 'Marketing and customer engagement curriculum.',
  learningArea: {
    name: 'Marketing',
    code: 'MKT',
    description: 'Marketing campaigns and customer relationship curriculum.',
    status: 'ACTIVE',
    displayOrder: 11,
  },
  competencies: [
    {
      name: 'Campaign Planning',
      code: 'MKT-COMP-001',
      description: 'Plan and deliver customer-facing marketing initiatives.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Audience Segmentation', code: 'MKT-COMP-001-G1', description: 'Define target groups.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Content Planning', code: 'MKT-COMP-001-G2', description: 'Structure campaign messaging.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
