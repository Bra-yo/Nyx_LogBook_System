-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MentorshipTrack" AS ENUM ('CAREER', 'BUSINESS');

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "cohortId" TEXT,
ADD COLUMN     "mentorshipTrack" "MentorshipTrack";

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "mentorshipTrack" "MentorshipTrack" NOT NULL,
    "status" "CohortStatus" NOT NULL DEFAULT 'UPCOMING',
    "description" TEXT,
    "maximumCapacity" INTEGER NOT NULL DEFAULT 25,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_mentor_assignments" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_mentor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_code_key" ON "cohorts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_mentor_assignments_cohortId_supervisorId_key" ON "cohort_mentor_assignments"("cohortId", "supervisorId");

-- AddForeignKey
ALTER TABLE "cohort_mentor_assignments" ADD CONSTRAINT "cohort_mentor_assignments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_mentor_assignments" ADD CONSTRAINT "cohort_mentor_assignments_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
