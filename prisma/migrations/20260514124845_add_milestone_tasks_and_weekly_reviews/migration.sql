-- CreateEnum
CREATE TYPE "MilestoneTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED');

-- AlterTable
ALTER TABLE "logbook_entries" ADD COLUMN     "milestoneTaskId" TEXT;

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "mentorId" TEXT,
ALTER COLUMN "learnerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "milestone_tasks" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "expectedOutput" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneTaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_mentor_task_reviews" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "milestoneTaskId" TEXT,
    "mentorId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "competencyLevel" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "SupervisorReviewStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_mentor_task_reviews_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_milestoneTaskId_fkey" FOREIGN KEY ("milestoneTaskId") REFERENCES "milestone_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_mentor_task_reviews" ADD CONSTRAINT "weekly_mentor_task_reviews_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_mentor_task_reviews" ADD CONSTRAINT "weekly_mentor_task_reviews_milestoneTaskId_fkey" FOREIGN KEY ("milestoneTaskId") REFERENCES "milestone_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_mentor_task_reviews" ADD CONSTRAINT "weekly_mentor_task_reviews_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_mentor_task_reviews" ADD CONSTRAINT "weekly_mentor_task_reviews_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
