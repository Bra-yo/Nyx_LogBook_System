import type { CurriculumPackage } from './types'

export const computerScienceCurriculum: CurriculumPackage = {
  id: 'computer-science',
  name: 'Computer Science',
  description: 'Core curriculum for programming, systems, and applied computing.',
  learningArea: {
    name: 'Computer Science',
    code: 'CS',
    description: 'Foundational computing and software engineering curriculum.',
    status: 'ACTIVE',
    displayOrder: 1,
  },
  competencies: [
    {
      name: 'Programming Fundamentals',
      code: 'CS-COMP-001',
      description: 'Develop core programming skills and problem-solving habits.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Variables', code: 'CS-COMP-001-G1', description: 'Variable declaration and usage.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Functions', code: 'CS-COMP-001-G2', description: 'Reusable function design.', status: 'ACTIVE', sortOrder: 2 },
        { name: 'Arrays', code: 'CS-COMP-001-G3', description: 'Data collection structures.', status: 'ACTIVE', sortOrder: 3 },
      ],
    },
    {
      name: 'Database Systems',
      code: 'CS-COMP-002',
      description: 'Understand relational data design and querying.',
      difficulty: 'INTERMEDIATE',
      status: 'ACTIVE',
      sortOrder: 2,
      groups: [
        { name: 'ER Modelling', code: 'CS-COMP-002-G1', description: 'Entity relationship modelling.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'SQL', code: 'CS-COMP-002-G2', description: 'Structured query language usage.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
    {
      name: 'Computer Networks',
      code: 'CS-COMP-003',
      description: 'Understand communication protocols and network fundamentals.',
      difficulty: 'INTERMEDIATE',
      status: 'ACTIVE',
      sortOrder: 3,
      groups: [
        { name: 'OSI Model', code: 'CS-COMP-003-G1', description: 'Layered network architecture.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'TCP/IP', code: 'CS-COMP-003-G2', description: 'Core internet protocols.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
