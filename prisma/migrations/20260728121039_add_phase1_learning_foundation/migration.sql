-- CreateEnum
CREATE TYPE "competency_difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- AlterTable
ALTER TABLE "competencies" ADD COLUMN     "difficulty" "competency_difficulty",
ADD COLUMN     "estimatedDurationWeeks" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "learning_areas" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "competencies_learningAreaId_status_idx" ON "competencies"("learningAreaId", "status");

-- CreateIndex
CREATE INDEX "competencies_status_idx" ON "competencies"("status");

-- CreateIndex
CREATE INDEX "competencies_sortOrder_idx" ON "competencies"("sortOrder");

-- CreateIndex
CREATE INDEX "learning_areas_status_idx" ON "learning_areas"("status");

-- CreateIndex
CREATE INDEX "learning_areas_sortOrder_idx" ON "learning_areas"("sortOrder");
