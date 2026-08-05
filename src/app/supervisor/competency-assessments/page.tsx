"use client";

import { CompetencyAssessmentForm } from "@/components/competency/assessment-form";

export default function SupervisorCompetencyAssessmentsPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Competency assessments</h1>
        <p className="text-sm text-muted-foreground">Create, edit, and submit competency assessments for learners you are actively mentoring.</p>
      </div>

      <CompetencyAssessmentForm
        mode="SUPERVISOR"
        title="Mentor competency assessment"
        description="Select a learner learning path assigned to you, rate their competency, and submit draft or final assessments. Drafts can be edited until finalized."
        endpoint="/api/supervisor/competency-assessments"
      />
    </div>
  );
}
