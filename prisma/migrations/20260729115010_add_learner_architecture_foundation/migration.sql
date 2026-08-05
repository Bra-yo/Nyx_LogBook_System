-- CreateEnum
CREATE TYPE "learner_path_status" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "mentor_allocation_status" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'ENDED', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "mentor_allocation_reason" AS ENUM ('AUTO_MATCH', 'MANUAL_ASSIGNMENT', 'WORKLOAD_BALANCING', 'SPECIALIST_REQUEST', 'MENTOR_LEFT', 'LEARNER_REQUEST');

-- CreateTable
CREATE TABLE "learner_learning_paths" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "status" "learner_path_status" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_mentor_allocations" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "status" "mentor_allocation_status" NOT NULL DEFAULT 'PENDING',
    "allocationReason" "mentor_allocation_reason" NOT NULL DEFAULT 'AUTO_MATCH',
    "allocatedBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_mentor_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learner_learning_paths_learnerId_competencyId_idx" ON "learner_learning_paths"("learnerId", "competencyId");

-- CreateIndex
CREATE INDEX "learner_learning_paths_learnerId_status_idx" ON "learner_learning_paths"("learnerId", "status");

-- CreateIndex
CREATE INDEX "learner_learning_paths_competencyId_status_idx" ON "learner_learning_paths"("competencyId", "status");

-- CreateIndex
CREATE INDEX "learner_learning_paths_status_idx" ON "learner_learning_paths"("status");

-- CreateIndex
CREATE INDEX "learner_mentor_allocations_mentorId_status_idx" ON "learner_mentor_allocations"("mentorId", "status");

-- CreateIndex
CREATE INDEX "learner_mentor_allocations_learningPathId_status_idx" ON "learner_mentor_allocations"("learningPathId", "status");

-- CreateIndex
CREATE INDEX "learner_mentor_allocations_status_idx" ON "learner_mentor_allocations"("status");

-- AddForeignKey
ALTER TABLE "learner_learning_paths" ADD CONSTRAINT "learner_learning_paths_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_learning_paths" ADD CONSTRAINT "learner_learning_paths_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_mentor_allocations" ADD CONSTRAINT "learner_mentor_allocations_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learner_learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_mentor_allocations" ADD CONSTRAINT "learner_mentor_allocations_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_mentor_allocations" ADD CONSTRAINT "learner_mentor_allocations_allocatedBy_fkey" FOREIGN KEY ("allocatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
