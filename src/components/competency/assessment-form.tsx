"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCompetencyAssessmentStatusLabel,
  getCompetencyLevelLabel,
  getCompetencyLevelStars,
  resolveCompetencyLevel,
} from "@/lib/competency-assessment";
import { Loader2, Pencil, Trash2 } from "lucide-react";

interface LearningPathOption {
  id: string;
  learner: { id: string; name: string; email: string };
  competency: { id: string; name: string; code: string };
  status: string;
}

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
    learner: { id: string; name: string; email: string };
    competency: { name: string; code: string };
  };
  assessedBySupervisor?: { user: { name: string | null } } | null;
  assessedByAdmin?: { user: { name: string | null } } | null;
}

interface AssessmentFormProps {
  mode: "SUPERVISOR" | "ADMIN";
  title: string;
  description: string;
  endpoint: string;
}

interface AssessmentFormState {
  learningPathId: string;
  score: string;
  comments: string;
  evidence: string;
}

const getInitialFormState = (): AssessmentFormState => ({
  learningPathId: "",
  score: "3",
  comments: "",
  evidence: "",
});

export function CompetencyAssessmentForm({ mode, title, description, endpoint }: AssessmentFormProps) {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [availableLearningPaths, setAvailableLearningPaths] = useState<LearningPathOption[]>([]);
  const [form, setForm] = useState<AssessmentFormState>(getInitialFormState);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load assessments");
      }
      setAssessments(payload.assessments ?? []);
      setAvailableLearningPaths(payload.availableLearningPaths ?? []);
    } catch (loadError) {
      console.error(loadError);
      toast.error(loadError instanceof Error ? loadError.message : "Unable to load assessments");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAssessments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAssessments]);

  const sortedAssessments = useMemo(() => {
    return [...assessments].sort((left, right) => new Date(right.assessmentDate).getTime() - new Date(left.assessmentDate).getTime());
  }, [assessments]);

  const derivedLevel = useMemo(() => {
    const parsedScore = Number.parseInt(form.score, 10);
    if (Number.isNaN(parsedScore)) {
      return null;
    }
    return resolveCompetencyLevel(parsedScore);
  }, [form.score]);

  const handleSubmit = async (event: React.FormEvent, status: "DRAFT" | "FINAL") => {
    event.preventDefault();
    const score = Number.parseInt(form.score, 10);
    const trimmedComments = form.comments.trim();

    if (!form.learningPathId) {
      setError("Please select a learner competency before saving.");
      return;
    }

    if (Number.isNaN(score) || score < 1 || score > 5) {
      setError("Score must be an integer between 1 and 5.");
      return;
    }

    if (trimmedComments.length < 10) {
      setError("Comments are required and must be at least 10 characters long.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const method = editingAssessmentId ? "PUT" : "POST";
      const url = editingAssessmentId ? `${endpoint}/${editingAssessmentId}` : endpoint;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learningPathId: form.learningPathId,
          score,
          comments: trimmedComments,
          evidence: form.evidence.trim() || null,
          status,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to save assessment");
      }
      toast.success(editingAssessmentId ? "Assessment updated" : status === "FINAL" ? "Assessment submitted" : "Draft saved");
      setForm(getInitialFormState());
      setEditingAssessmentId(null);
      await loadAssessments();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Unable to save assessment");
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save assessment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (assessmentId: string) => {
    if (!window.confirm("Delete this draft assessment?")) {
      return;
    }

    setIsDeleting(assessmentId);
    try {
      const response = await fetch(`${endpoint}/${assessmentId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to delete assessment");
      }
      toast.success("Assessment deleted");
      await loadAssessments();
    } catch (deleteError) {
      console.error(deleteError);
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete assessment");
    } finally {
      setIsDeleting(null);
    }
  };

  const startEditing = (assessment: AssessmentRecord) => {
    setEditingAssessmentId(assessment.id);
    setForm({
      learningPathId: assessment.learnerLearningPath.id,
      score: String(assessment.score),
      comments: assessment.comments ?? "",
      evidence: assessment.evidence ?? "",
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Badge variant="secondary">{mode === "SUPERVISOR" ? "Mentor" : "Administrator"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event, "DRAFT")}>
            <div className="space-y-2">
              <Label>Competency</Label>
              <Select value={form.learningPathId} onValueChange={(value) => setForm((current) => ({ ...current, learningPathId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a learning path" />
                </SelectTrigger>
                <SelectContent>
                  {availableLearningPaths.map((path) => (
                    <SelectItem key={path.id} value={path.id}>
                      {path.learner.name} • {path.competency.name} ({path.competency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="score">Assessment score</Label>
                <Input
                  id="score"
                  type="number"
                  min="1"
                  max="5"
                  value={form.score}
                  onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Derived competency level</Label>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  {derivedLevel ? (
                    <>
                      <div className="font-medium">{getCompetencyLevelLabel(Number.parseInt(form.score, 10))}</div>
                      <div className="text-muted-foreground">{getCompetencyLevelStars(Number.parseInt(form.score, 10))}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select a score to preview the level</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={form.comments}
                onChange={(event) => setForm((current) => ({ ...current, comments: event.target.value }))}
                placeholder="Provide actionable feedback with at least 10 characters"
                minLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence</Label>
              <Textarea
                id="evidence"
                value={form.evidence}
                onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.value }))}
                placeholder="Optional evidence, artifacts, or examples"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span> : "Save Draft"}
              </Button>
              <Button type="button" variant="secondary" disabled={isSaving} onClick={(event) => void handleSubmit(event as unknown as React.FormEvent, "FINAL")}>
                {isSaving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting…</span> : "Submit Final"}
              </Button>
              {editingAssessmentId ? (
                <Button type="button" variant="outline" onClick={() => { setEditingAssessmentId(null); setForm(getInitialFormState()); setError(null); }}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment history</CardTitle>
          <CardDescription>Drafts remain editable and finals remain immutable.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading assessments…</div>
          ) : sortedAssessments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No assessments recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {sortedAssessments.map((assessment) => (
                <div key={assessment.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{assessment.learnerLearningPath.competency.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(assessment.assessmentDate).toLocaleDateString()} • {assessment.learnerLearningPath.learner.name}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={assessment.status === "FINAL" ? "default" : "secondary"}>{getCompetencyAssessmentStatusLabel(assessment.status as "DRAFT" | "SUBMITTED" | "FINAL")}</Badge>
                      <Badge variant="outline">{assessment.status === "FINAL" ? "Final" : assessment.status === "SUBMITTED" ? "Submitted" : "Draft"}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium">Score {assessment.score}/5</div>
                      <div className="text-sm text-muted-foreground">Level: {getCompetencyLevelLabel(assessment.score)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Assessed by</div>
                      <div className="text-sm text-muted-foreground">
                        {assessment.assessedBySupervisor?.user.name ? `Mentor • ${assessment.assessedBySupervisor.user.name}` : assessment.assessedByAdmin?.user.name ? `Administrator • ${assessment.assessedByAdmin.user.name}` : "System"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="font-medium">Comments</div>
                    <p className="text-muted-foreground">{assessment.comments || "No comments provided."}</p>
                  </div>

                  {assessment.evidence ? (
                    <div className="mt-3 text-sm">
                      <div className="font-medium">Evidence</div>
                      <p className="text-muted-foreground">{assessment.evidence}</p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {assessment.status === "DRAFT" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEditing(assessment)}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void handleDelete(assessment.id)} disabled={isDeleting === assessment.id}>
                          {isDeleting === assessment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline">Read-only final assessment</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
