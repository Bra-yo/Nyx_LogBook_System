import type { CurriculumPackage } from './types'

export const cyberSecurityCurriculum: CurriculumPackage = {
  id: 'cyber-security',
  name: 'Cyber Security',
  description: 'Security operations and defensive practice curriculum.',
  learningArea: {
    name: 'Cyber Security',
    code: 'CSec',
    description: 'Security, compliance, and threat management curriculum.',
    status: 'ACTIVE',
    displayOrder: 5,
  },
  competencies: [
    {
      name: 'Threat Awareness',
      code: 'CSec-COMP-001',
      description: 'Recognise common risks and incident patterns.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Risk Identification', code: 'CSec-COMP-001-G1', description: 'Recognize cyber risks.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Controls', code: 'CSec-COMP-001-G2', description: 'Apply basic security controls.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
