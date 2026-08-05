import type { CurriculumPackage } from './types'

export const networkingCurriculum: CurriculumPackage = {
  id: 'networking',
  name: 'Networking',
  description: 'Networking architecture and operations curriculum.',
  learningArea: {
    name: 'Networking',
    code: 'NET',
    description: 'Networking infrastructure, operations, and support curriculum.',
    status: 'ACTIVE',
    displayOrder: 4,
  },
  competencies: [
    {
      name: 'Networking Fundamentals',
      code: 'NET-COMP-001',
      description: 'Understand switching, routing, and protocols.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'LAN Concepts', code: 'NET-COMP-001-G1', description: 'Local area network basics.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'IP Routing', code: 'NET-COMP-001-G2', description: 'Routes and forwarding.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
