-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'MENTOR_REVIEWED', 'LECTURER_REVIEWED', 'COMPLETED');

-- AlterTable
ALTER TABLE "logbook_entries" ADD COLUMN     "milestoneId" TEXT;

-- AlterTable
ALTER TABLE "office_locations" ADD COLUMN     "mentorId" TEXT;

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_mentor_assessments" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "competencyLevel" INTEGER NOT NULL,
    "status" "SupervisorReviewStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_mentor_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_lecturer_assessments" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "technicalScore" INTEGER,
    "communicationScore" INTEGER,
    "professionalismScore" INTEGER,
    "overallScore" INTEGER,
    "feedback" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_lecturer_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "milestone_mentor_assessments_milestoneId_key" ON "milestone_mentor_assessments"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_lecturer_assessments_milestoneId_key" ON "milestone_lecturer_assessments"("milestoneId");

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_locations" ADD CONSTRAINT "office_locations_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_mentor_assessments" ADD CONSTRAINT "milestone_mentor_assessments_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_mentor_assessments" ADD CONSTRAINT "milestone_mentor_assessments_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_lecturer_assessments" ADD CONSTRAINT "milestone_lecturer_assessments_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_lecturer_assessments" ADD CONSTRAINT "milestone_lecturer_assessments_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
