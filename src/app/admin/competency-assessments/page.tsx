"use client";

import { CompetencyAssessmentForm } from "@/components/competency/assessment-form";

export default function AdminCompetencyAssessmentsPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Competency assessments</h1>
        <p className="text-sm text-muted-foreground">Administrators can review, finalize, and manage learner competency assessments.</p>
      </div>

      <CompetencyAssessmentForm
        mode="ADMIN"
        title="Create and manage competency assessments"
        description="Choose a learner learning path, provide a score, and submit final assessments for review. Draft assessments remain editable until final submission."
        endpoint="/api/admin/competency-assessments"
      />
    </div>
  );
}
