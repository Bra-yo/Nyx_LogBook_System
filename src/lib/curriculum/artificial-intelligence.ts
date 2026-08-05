import type { CurriculumPackage } from './types'

export const artificialIntelligenceCurriculum: CurriculumPackage = {
  id: 'artificial-intelligence',
  name: 'Artificial Intelligence',
  description: 'AI and machine learning foundations curriculum.',
  learningArea: {
    name: 'Artificial Intelligence',
    code: 'AI',
    description: 'AI and data-driven decision-making curriculum.',
    status: 'ACTIVE',
    displayOrder: 6,
  },
  competencies: [
    {
      name: 'Data Preparation',
      code: 'AI-COMP-001',
      description: 'Prepare data for experimentation and model training.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Cleaning', code: 'AI-COMP-001-G1', description: 'Clean and transform datasets.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Labeling', code: 'AI-COMP-001-G2', description: 'Structure training data.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
