import type { CurriculumPackage } from './types'

export const businessInformationTechnologyCurriculum: CurriculumPackage = {
  id: 'business-information-technology',
  name: 'Business Information Technology',
  description: 'Business technology and process integration curriculum.',
  learningArea: {
    name: 'Business Information Technology',
    code: 'BIT',
    description: 'Business operations and digital process curriculum.',
    status: 'ACTIVE',
    displayOrder: 8,
  },
  competencies: [
    {
      name: 'Business Process Automation',
      code: 'BIT-COMP-001',
      description: 'Apply technology to streamline business operations.',
      difficulty: 'INTERMEDIATE',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Workflow Mapping', code: 'BIT-COMP-001-G1', description: 'Map current processes.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Automation Design', code: 'BIT-COMP-001-G2', description: 'Design simple automation solutions.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
