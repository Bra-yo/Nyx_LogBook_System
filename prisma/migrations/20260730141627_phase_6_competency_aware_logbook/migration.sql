/*
  Warnings:

  - The `status` column on the `lecturer_assessments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "evidence_type" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'LINK', 'SOURCE_CODE');

-- CreateEnum
CREATE TYPE "CompetencyAssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FINAL');

-- CreateEnum
CREATE TYPE "CompetencyLevel" AS ENUM ('NOT_YET_DEMONSTRATED', 'EMERGING', 'COMPETENT', 'PROFICIENT', 'EXPERT');

-- CreateEnum
CREATE TYPE "LecturerAssessmentStatus" AS ENUM ('NOT_ASSESSED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "lecturer_assessments" DROP COLUMN "status",
ADD COLUMN     "status" "LecturerAssessmentStatus" NOT NULL DEFAULT 'NOT_ASSESSED';

-- AlterTable
ALTER TABLE "logbook_entries" ADD COLUMN     "hoursWorked" DOUBLE PRECISION,
ADD COLUMN     "learningPathId" TEXT;

-- DropEnum
DROP TYPE "AssessmentStatus";

-- CreateTable
CREATE TABLE "competency_assessments" (
    "id" TEXT NOT NULL,
    "learnerLearningPathId" TEXT NOT NULL,
    "assessedBySupervisorId" TEXT,
    "assessedByAdminId" TEXT,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "level" "CompetencyLevel" NOT NULL DEFAULT 'NOT_YET_DEMONSTRATED',
    "comments" TEXT,
    "evidence" TEXT,
    "status" "CompetencyAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook_entry_evidence" (
    "id" TEXT NOT NULL,
    "logbookEntryId" TEXT NOT NULL,
    "type" "evidence_type" NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logbook_entry_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competency_assessments_learnerLearningPathId_status_idx" ON "competency_assessments"("learnerLearningPathId", "status");

-- CreateIndex
CREATE INDEX "competency_assessments_status_assessmentDate_idx" ON "competency_assessments"("status", "assessmentDate");

-- CreateIndex
CREATE INDEX "logbook_entry_evidence_logbookEntryId_idx" ON "logbook_entry_evidence"("logbookEntryId");

-- CreateIndex
CREATE INDEX "logbook_entries_learningPathId_idx" ON "logbook_entries"("learningPathId");

-- AddForeignKey
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_learnerLearningPathId_fkey" FOREIGN KEY ("learnerLearningPathId") REFERENCES "learner_learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_assessedBySupervisorId_fkey" FOREIGN KEY ("assessedBySupervisorId") REFERENCES "supervisor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_assessments" ADD CONSTRAINT "competency_assessments_assessedByAdminId_fkey" FOREIGN KEY ("assessedByAdminId") REFERENCES "admin_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entry_evidence" ADD CONSTRAINT "logbook_entry_evidence_logbookEntryId_fkey" FOREIGN KEY ("logbookEntryId") REFERENCES "logbook_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learner_learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;
