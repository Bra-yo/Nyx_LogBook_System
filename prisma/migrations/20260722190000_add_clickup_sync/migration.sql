ALTER TABLE "cohorts"
ADD COLUMN "clickupListId" TEXT,
ADD COLUMN "clickupLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "clickupSyncStatus" TEXT,
ADD COLUMN "clickupSyncError" TEXT;

ALTER TABLE "student_profiles"
ADD COLUMN "clickupTaskId" TEXT,
ADD COLUMN "clickupLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "clickupSyncStatus" TEXT,
ADD COLUMN "clickupSyncError" TEXT;