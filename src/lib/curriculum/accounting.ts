import type { CurriculumPackage } from './types'

export const accountingCurriculum: CurriculumPackage = {
  id: 'accounting',
  name: 'Accounting',
  description: 'Accounting and financial controls curriculum.',
  learningArea: {
    name: 'Accounting',
    code: 'ACC',
    description: 'Financial control and reporting curriculum.',
    status: 'ACTIVE',
    displayOrder: 9,
  },
  competencies: [
    {
      name: 'Bookkeeping',
      code: 'ACC-COMP-001',
      description: 'Record transactions accurately and consistently.',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      sortOrder: 1,
      groups: [
        { name: 'Ledger Posting', code: 'ACC-COMP-001-G1', description: 'Post daily transactions.', status: 'ACTIVE', sortOrder: 1 },
        { name: 'Reconciliation', code: 'ACC-COMP-001-G2', description: 'Reconcile balances.', status: 'ACTIVE', sortOrder: 2 },
      ],
    },
  ],
}
