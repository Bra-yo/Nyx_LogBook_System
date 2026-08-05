-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('CAREER_MENTEE', 'BUSINESS_MENTEE');

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "learningPathId" TEXT,
ADD COLUMN     "mentorId" TEXT,
ADD COLUMN     "registrationType" "RegistrationType";

-- AlterTable
ALTER TABLE "supervisor_profiles" ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "learningAreaId" TEXT,
ADD COLUMN     "mentorCapacity" INTEGER NOT NULL DEFAULT 10;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learner_learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_profiles" ADD CONSTRAINT "supervisor_profiles_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
