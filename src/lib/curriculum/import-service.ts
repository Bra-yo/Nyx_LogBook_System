import { prisma } from '@/lib/prisma'
import type { CurriculumImportSummary, CurriculumPackage } from './types'

function normalizeCode(value: string) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
}

function toLearningStatus(status: string | undefined) {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

function toDifficulty(value: string | undefined) {
  return value === 'BEGINNER' || value === 'INTERMEDIATE' || value === 'ADVANCED' || value === 'EXPERT'
    ? value
    : 'BEGINNER'
}

export async function importCurriculumPackages(packages: CurriculumPackage[]) {
  const startedAt = Date.now()
  const summary: CurriculumImportSummary = {
    learningAreasCreated: 0,
    competenciesCreated: 0,
    competencyGroupsCreated: 0,
    skippedDuplicates: 0,
    processingTimeMs: 0,
    packagesImported: 0,
    packagesSkipped: 0,
  }

  for (const curriculum of packages) {
    const existingArea = await prisma.learningArea.findFirst({
      where: {
        OR: [
          { name: { equals: curriculum.learningArea.name, mode: 'insensitive' } },
          { code: { equals: curriculum.learningArea.code, mode: 'insensitive' } },
        ],
      },
      include: {
        competencies: { include: { competencyGroups: true } },
      },
    })

    const learningArea = existingArea
      ? await prisma.learningArea.update({
          where: { id: existingArea.id },
          data: {
            name: curriculum.learningArea.name,
            code: normalizeCode(curriculum.learningArea.code) || existingArea.code,
            description: curriculum.learningArea.description,
            status: toLearningStatus(curriculum.learningArea.status),
            sortOrder: curriculum.learningArea.displayOrder,
          },
        })
      : await prisma.learningArea.create({
          data: {
            name: curriculum.learningArea.name,
            code: normalizeCode(curriculum.learningArea.code) || 'LA',
            description: curriculum.learningArea.description,
            status: toLearningStatus(curriculum.learningArea.status),
            sortOrder: curriculum.learningArea.displayOrder,
          },
        })

    if (!existingArea) {
      summary.learningAreasCreated += 1
    } else {
      summary.skippedDuplicates += 1
    }

    for (const competency of curriculum.competencies) {
      const existingCompetency = await prisma.competency.findFirst({
        where: {
          learningAreaId: learningArea.id,
          OR: [
            { name: { equals: competency.name, mode: 'insensitive' } },
            { code: { equals: competency.code, mode: 'insensitive' } },
          ],
        },
        include: { competencyGroups: true },
      })

      const createdCompetency = existingCompetency
        ? await prisma.competency.update({
            where: { id: existingCompetency.id },
            data: {
              name: competency.name,
              code: competency.code || existingCompetency.code,
              description: competency.description,
              status: toLearningStatus(competency.status),
              difficulty: toDifficulty(competency.difficulty),
              sortOrder: competency.sortOrder,
            },
          })
        : await prisma.competency.create({
            data: {
              learningAreaId: learningArea.id,
              name: competency.name,
              code: competency.code || `${learningArea.code}-${String(summary.competenciesCreated + 1).padStart(3, '0')}`,
              description: competency.description,
              status: toLearningStatus(competency.status),
              difficulty: toDifficulty(competency.difficulty),
              sortOrder: competency.sortOrder,
            },
          })

      if (!existingCompetency) {
        summary.competenciesCreated += 1
      } else {
        summary.skippedDuplicates += 1
      }

      for (const group of competency.groups) {
        const existingGroup = await prisma.competencyGroup.findFirst({
          where: {
            competencyId: createdCompetency.id,
            OR: [
              { name: { equals: group.name, mode: 'insensitive' } },
              { code: { equals: group.code, mode: 'insensitive' } },
            ],
          },
        })

        if (existingGroup) {
          await prisma.competencyGroup.update({
            where: { id: existingGroup.id },
            data: {
              name: group.name,
              code: group.code || existingGroup.code,
              description: group.description,
              status: toLearningStatus(group.status),
            },
          })
          summary.skippedDuplicates += 1
          continue
        }

        await prisma.competencyGroup.create({
          data: {
            competencyId: createdCompetency.id,
            name: group.name,
            code: group.code || `${createdCompetency.code}-G${String(summary.competencyGroupsCreated + 1).padStart(2, '0')}`,
            description: group.description,
            status: toLearningStatus(group.status),
          },
        })

        summary.competencyGroupsCreated += 1
      }
    }

    summary.packagesImported += 1
  }

  summary.processingTimeMs = Date.now() - startedAt
  return summary
}
