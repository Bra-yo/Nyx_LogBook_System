/*
  Warnings:

  - You are about to drop the column `metadata` on the `competencies` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `learning_areas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "competencies" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "learning_areas" DROP COLUMN "metadata";
