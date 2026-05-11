/*
  Warnings:

  - You are about to drop the column `approved` on the `supervisor_comments` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `supervisor_comments` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `supervisor_comments` table. All the data in the column will be lost.
  - Added the required column `competencyDescription` to the `supervisor_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `competencyLabel` to the `supervisor_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `competencyScore` to the `supervisor_comments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SupervisorReviewStatus" AS ENUM ('APPROVED', 'NEEDS_REVISION', 'REJECTED', 'PENDING');

-- AlterTable
ALTER TABLE "supervisor_comments" DROP COLUMN "approved",
DROP COLUMN "comment",
DROP COLUMN "rating",
ADD COLUMN     "competencyDescription" TEXT NOT NULL,
ADD COLUMN     "competencyLabel" TEXT NOT NULL,
ADD COLUMN     "competencyScore" INTEGER NOT NULL,
ADD COLUMN     "optionalComment" TEXT,
ADD COLUMN     "status" "SupervisorReviewStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
