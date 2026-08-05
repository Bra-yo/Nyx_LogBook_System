"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAssessmentTimeline,
  getCompetencyAssessmentStatusLabel,
  getCompetencyLevelLabel,
  type CompetencyAssessmentStatus,
} from "@/lib/competency-assessment";

const cardToneClasses: Record<string, string> = {
  default: "border-border bg-background",
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
};

export function CompetencyStatCard({
  title,
  value,
  subtitle,
  description,
  tone = "default",
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon?: ReactNode;
}) {
  return (
    <Card className={cardToneClasses[tone]}>
      <CardHeader className="flex items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}

export function CompetencyAssessmentTimeline({
  assessments,
}: {
  assessments: Array<{
    id: string;
    score: number;
    status: CompetencyAssessmentStatus;
    assessmentDate: string;
    learnerLearningPath: { competency: { name: string; code: string } };
  }>;
}) {
  const timeline = getAssessmentTimeline(assessments);

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent competency assessments</CardTitle>
          <CardDescription>Finalised progress feedback for your competencies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted/50 bg-muted/20 p-6 text-sm text-muted-foreground">
            No final competency assessments available yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent competency assessments</CardTitle>
        <CardDescription>Latest final ratings and comments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((assessment) => (
          <div key={assessment.id} className="rounded-2xl border border-muted/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">{assessment.learnerLearningPath.competency.name}</p>
                <p className="text-xs text-muted-foreground">{assessment.learnerLearningPath.competency.code}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{getCompetencyLevelLabel(assessment.score)}</Badge>
                <span>{new Date(assessment.assessmentDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Score {assessment.score}/5</span>
              <Badge variant="secondary">{getCompetencyAssessmentStatusLabel(assessment.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
