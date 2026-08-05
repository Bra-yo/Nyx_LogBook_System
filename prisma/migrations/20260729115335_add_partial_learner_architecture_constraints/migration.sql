CREATE UNIQUE INDEX "learner_learning_paths_active_unique" ON "learner_learning_paths" ("learnerId", "competencyId") WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "learner_mentor_allocations_active_unique" ON "learner_mentor_allocations" ("learningPathId") WHERE "status" = 'ACTIVE';