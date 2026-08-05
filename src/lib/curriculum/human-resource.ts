import type { CurriculumPackage } from './types'

export const humanResourceCurriculum: CurriculumPackage = {
  id: 'human-resource',
  name: 'Human Resource',
  description: 'People operations and workforce development curriculum.',
  learningArea: {
    name: 'Human Resource',
    code: 'HR',
    description: 'People management and development curriculum.',
    status: 'ACTIVE',
    displayOrder: 10,
  },
  competencies: [
    {
      name: 'People Management',
      code: 'HR-COMP-001',
      description: 'Support employee lifecycle and engagement.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Recruitment', code: 'HR-COMP-001-G1', description: 'Support hiring processes.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Development', code: 'HR-COMP-001-G2', description: 'Support learning and growth.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
