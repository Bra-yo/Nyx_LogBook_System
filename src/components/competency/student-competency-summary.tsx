"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetencyStatCard, CompetencyAssessmentTimeline } from "./competency-progress";
import { Loader2 } from "lucide-react";
import type { CompetencyAssessmentStatus } from "@/lib/competency-assessment";

interface LatestAssessmentSummary {
  score?: number | null;
  assessmentDate?: string | null;
}

interface CompetencyDashboardResponse {
  success: boolean;
  learningPaths: Array<{ id: string; competency: { name: string; code: string }; status: string }>;
  assessmentSummary: {
    currentScore: number | null;
    currentLevel: string | "NOT_ASSESSED";
    latestAssessmentDate: string;
    latestAssessment: LatestAssessmentSummary | null;
  };
  statusCounts: { DRAFT: number; SUBMITTED: number; FINAL: number };
  averageScore: number | null;
  progressPercentage: number;
  totalLearningPaths: number;
  totalFinalAssessments: number;
  recentFinalAssessments: Array<{
    id: string;
    score: number;
    status: CompetencyAssessmentStatus;
    assessmentDate: string;
    learnerLearningPath: { competency: { name: string; code: string } };
  }>;
}

export function StudentCompetencySummary() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CompetencyDashboardResponse | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/student/competency-dashboard");
        const payload = (await response.json()) as CompetencyDashboardResponse;
        if (active && payload.success) {
          setDashboard(payload);
        }
      } catch (error) {
        console.error("Failed to load competency summary", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Competency progress</CardTitle>
          <CardDescription>Loading your latest competency progress.</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Competency progress</CardTitle>
          <CardDescription>Unable to load progress details.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Check your connection or try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CompetencyStatCard
          title="Active learning paths"
          value={dashboard.totalLearningPaths}
          subtitle="Your assigned competencies"
          description="Learning paths that are active or planned for this programme."
        />
        <CompetencyStatCard
          title="Completed assessments"
          value={dashboard.totalFinalAssessments}
          subtitle="Final competency ratings"
          description="Finalised assessments across all of your current competency paths."
          tone={dashboard.totalFinalAssessments > 0 ? "success" : "default"}
        />
        <CompetencyStatCard
          title="Average competency score"
          value={dashboard.averageScore ?? "N/A"}
          subtitle="Cumulative score across final assessments"
          description="Shows your average score on final competency evaluations."
          tone={dashboard.averageScore && dashboard.averageScore >= 4 ? "success" : dashboard.averageScore && dashboard.averageScore >= 3 ? "warning" : "default"}
        />
        <CompetencyStatCard
          title="Progress completion"
          value={`${dashboard.progressPercentage}%`}
          subtitle="Completed competency paths"
          description="Percentage of your current learning paths with at least one final assessment."
          tone={dashboard.progressPercentage >= 70 ? "success" : dashboard.progressPercentage >= 40 ? "warning" : "default"}
        />
      </div>

      <CompetencyAssessmentTimeline assessments={dashboard.recentFinalAssessments} />
    </div>
  );
}
