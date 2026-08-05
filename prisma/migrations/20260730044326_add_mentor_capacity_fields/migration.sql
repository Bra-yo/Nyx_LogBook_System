-- AlterTable
ALTER TABLE "supervisor_profiles" ADD COLUMN     "isAcceptingNewMentees" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxActiveMentees" INTEGER NOT NULL DEFAULT 10;
