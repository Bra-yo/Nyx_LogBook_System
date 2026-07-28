-- CreateTable
CREATE TABLE "competency_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "description" TEXT,
    "status" "learning_status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competency_groups_code_key" ON "competency_groups"("code");

-- CreateIndex
CREATE INDEX "competency_groups_competencyId_status_idx" ON "competency_groups"("competencyId", "status");

-- CreateIndex
CREATE INDEX "competency_groups_status_idx" ON "competency_groups"("status");

-- CreateIndex
CREATE UNIQUE INDEX "competency_groups_competencyId_name_key" ON "competency_groups"("competencyId", "name");

-- AddForeignKey
ALTER TABLE "competency_groups" ADD CONSTRAINT "competency_groups_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
