"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface AssessmentRecord {
  id: string;
  score: number;
  level: string;
  comments?: string | null;
  evidence?: string | null;
  status: string;
  assessmentDate: string;
  learnerLearningPath: {
    id: string;
    competency: { name: string; code: string };
  };
}

export default function StudentCompetencyAssessmentsPage() {
  const searchParams = useSearchParams();
  const learningPathId = searchParams.get("learningPathId") ?? "";
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!learningPathId) return;

    const load = async () => {
      setLoading(true);
      const response = await fetch(`/api/student/competency-assessments?learningPathId=${learningPathId}`);
      const payload = await response.json();
      if (payload.success) {
        setAssessments(payload.assessments);
      }
      setLoading(false);
    };

    load();
  }, [learningPathId]);

  if (!learningPathId) {
    return <div className="p-6">Select a learning path to view assessments.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Competency assessments</h1>
        <p className="text-sm text-muted-foreground">Recent mentor and admin evaluations for this learning path.</p>
      </div>

      {loading ? (
        <div>Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="rounded-lg border p-4">No assessments recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{assessment.learnerLearningPath.competency.name}</p>
                  <p className="text-sm text-muted-foreground">{assessment.learnerLearningPath.competency.code}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">Score {assessment.score}/5</div>
                  <div className="text-muted-foreground">{assessment.status}</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <p>{assessment.comments || "No comments provided."}</p>
                {assessment.evidence ? <p className="mt-2 text-muted-foreground">Evidence: {assessment.evidence}</p> : null}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Assessed on {new Date(assessment.assessmentDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
