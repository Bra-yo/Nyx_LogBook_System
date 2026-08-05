import type { CurriculumPackage } from './types'

export const softwareEngineeringCurriculum: CurriculumPackage = {
  id: 'software-engineering',
  name: 'Software Engineering',
  description: 'Engineering-oriented curriculum for product delivery and quality.',
  learningArea: {
    name: 'Software Engineering',
    code: 'SE',
    description: 'Delivery-focused software engineering curriculum.',
    status: 'ACTIVE',
    displayOrder: 2,
  },
  competencies: [
    {
      name: 'Requirements Analysis',
      code: 'SE-COMP-001',
      description: 'Translate stakeholder needs into actionable requirements.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'User Stories', code: 'SE-COMP-001-G1', description: 'Story writing and decomposition.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Acceptance Criteria', code: 'SE-COMP-001-G2', description: 'Definition of done.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
    {
      name: 'System Design',
      code: 'SE-COMP-002',
      description: 'Design maintainable and scalable software solutions.',
      difficulty: 'ADVANCED',
      status: 'ACTIVE',
      sortOrder: 2,
      groups: [
        { name: 'Architecture', code: 'SE-COMP-002-G1', description: 'System architecture planning.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Security', code: 'SE-COMP-002-G2', description: 'Secure design principles.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
