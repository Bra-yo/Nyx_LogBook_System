export type CurriculumStatus = 'ACTIVE' | 'INACTIVE'

export type CurriculumDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export interface CurriculumLearningAreaDefinition {
  name: string
  code: string
  description: string
  status: CurriculumStatus
  displayOrder: number
}

export interface CurriculumCompetencyGroupDefinition {
  name: string
  code: string
  description: string
  status: CurriculumStatus
  sortOrder: number
}

export interface CurriculumCompetencyDefinition {
  name: string
  code: string
  description: string
  difficulty: CurriculumDifficulty
  status: CurriculumStatus
  sortOrder: number
  groups: CurriculumCompetencyGroupDefinition[]
}

export interface CurriculumLearningPathDefinition {
  name: string
  description: string
  competencies: string[]
}

export interface CurriculumPackage {
  id: string
  name: string
  description: string
  learningArea: CurriculumLearningAreaDefinition
  competencies: CurriculumCompetencyDefinition[]
  learningPaths?: CurriculumLearningPathDefinition[]
}

export interface CurriculumImportSummary {
  learningAreasCreated: number
  competenciesCreated: number
  competencyGroupsCreated: number
  skippedDuplicates: number
  processingTimeMs: number
  packagesImported: number
  packagesSkipped: number
}
