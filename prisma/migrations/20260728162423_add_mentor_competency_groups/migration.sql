-- CreateTable
CREATE TABLE "mentor_competency_groups" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "competencyGroupId" TEXT NOT NULL,
    "status" "learning_status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_competency_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mentor_competency_groups_mentorId_status_idx" ON "mentor_competency_groups"("mentorId", "status");

-- CreateIndex
CREATE INDEX "mentor_competency_groups_competencyGroupId_status_idx" ON "mentor_competency_groups"("competencyGroupId", "status");

-- CreateIndex
CREATE INDEX "mentor_competency_groups_status_idx" ON "mentor_competency_groups"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_competency_groups_mentorId_competencyGroupId_key" ON "mentor_competency_groups"("mentorId", "competencyGroupId");

-- AddForeignKey
ALTER TABLE "mentor_competency_groups" ADD CONSTRAINT "mentor_competency_groups_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "supervisor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_competency_groups" ADD CONSTRAINT "mentor_competency_groups_competencyGroupId_fkey" FOREIGN KEY ("competencyGroupId") REFERENCES "competency_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
