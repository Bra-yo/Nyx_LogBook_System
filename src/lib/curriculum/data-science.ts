import type { CurriculumPackage } from './types'

export const dataScienceCurriculum: CurriculumPackage = {
  id: 'data-science',
  name: 'Data Science',
  description: 'Data analysis and evidence-based insight curriculum.',
  learningArea: {
    name: 'Data Science',
    code: 'DS',
    description: 'Data analytics and evidence-based insight curriculum.',
    status: 'ACTIVE',
    displayOrder: 7,
  },
  competencies: [
    {
      name: 'Data Analysis',
      code: 'DS-COMP-001',
      description: 'Transform data into practical insights.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Visualisation', code: 'DS-COMP-001-G1', description: 'Create charts and dashboards.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Reporting', code: 'DS-COMP-001-G2', description: 'Summarise findings clearly.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
