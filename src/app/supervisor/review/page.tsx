"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, FileText } from "lucide-react";
import { format } from "date-fns";
import { CompetencyReviewForm } from "@/components/supervisor/competency-review-form";
import {
  getLogbookDisplayStatus,
  getStatusBadgeProps,
} from "@/lib/logbook-status";
import { LogStatus } from "@/types";

interface LogbookEntry {
  id: string;
  title: string;
  description: string;
  activities: string;
  challenges?: string;
  learnings?: string;
  date: string;
  status: LogStatus;
  student: {
    user: {
      name: string;
      email: string;
    };
    regNumber: string;
    department?: {
      name: string;
    };
  };
  comments?: Array<{
    competencyScore: number;
    competencyLabel: string;
    competencyDescription: string;
    optionalComment?: string;
    status: string;
    createdAt: string;
  }>;
  assessments?: {
    status: string;
    assessedAt?: string;
  };
  learningPath?: {
    competency: {
      name: string;
      code: string;
      learningArea: {
        name: string;
      };
    };
  };
  project?: { title: string };
  milestone?: { title: string };
  milestoneTask?: { title: string };
  evidenceItems?: Array<{ id: string; type: string; title?: string; url: string }>;
}

export default function SupervisorReviewPage() {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/supervisor/review");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      } else {
        console.error("Failed to fetch entries:", response.status);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPendingEntries();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchPendingEntries]);

  const handleEntrySelect = (entry: LogbookEntry) => {
    setSelectedEntry(entry);
  };

  const handleAssessmentSubmit = async (
    entryId: string,
    score: number,
    comment: string,
    status: string,
  ) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/supervisor/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logbookEntryId: entryId,
          competencyScore: score,
          optionalComment: comment,
          status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the entry in local state
        setEntries((currentEntries) =>
          currentEntries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  comments: [...(entry.comments || []), data.assessment],
                }
              : entry,
          ),
        );
        setSelectedEntry(null);
      } else {
        console.error("Failed to save assessment");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (entry: LogbookEntry) => {
    const displayStatus = getLogbookDisplayStatus(entry);
    const badgeProps = getStatusBadgeProps(displayStatus);
    return <Badge className={badgeProps.className}>{badgeProps.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout title="Review Work Records">
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Review Work Records">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pending Reviews</h2>
            <p className="text-muted-foreground">
              Review and assess learner work records
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {entries.length} Pending
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Entries List */}
          <Card>
            <CardHeader>
              <CardTitle>Work Records</CardTitle>
              <CardDescription>
                Select a work record to review and assess
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    No learner work records available for review
                  </h3>
                  <p className="text-muted-foreground">
                    No learner work records are currently pending review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedEntry?.id === entry.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                      onClick={() => handleEntrySelect(entry)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {entry.student.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.student.user.email} • Learner
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), "MMM dd, yyyy")}
                        </div>
                        {getStatusBadge(entry)}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Activity
                          </h4>
                          <p className="font-medium">{entry.title}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Description
                          </h4>
                          <p className="text-sm">{entry.description}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Activities
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.activities}
                          </p>
                        </div>

                        {entry.challenges && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Challenges
                            </h4>
                            <p className="text-sm">{entry.challenges}</p>
                          </div>
                        )}

                        {entry.learnings && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Learnings
                            </h4>
                            <p className="text-sm">{entry.learnings}</p>
                          </div>
                        )}

                        {entry.evidenceItems && entry.evidenceItems.length > 0 && (
                          <div className="mt-4 p-3 bg-muted rounded">
                            <h4 className="font-medium text-sm mb-2">Evidence</h4>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              {entry.evidenceItems.map((item) => (
                                <div key={item.id}>
                                  <div className="font-medium">{item.title || item.type}</div>
                                  <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    {item.url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.comments && entry.comments.length > 0 && (
                          <div className="mt-4 p-3 bg-muted rounded">
                            <h4 className="font-medium text-sm mb-2">
                              Previous Assessment
                            </h4>
                            <div className="text-sm space-y-1">
                              <div>
                                <strong>Competency:</strong>{" "}
                                {entry.comments[0].competencyLabel} (
                                {entry.comments[0].competencyScore})
                              </div>
                              <div>
                                <strong>Status:</strong> {entry.comments[0].status}
                              </div>
                              {entry.comments[0].optionalComment && (
                                <div>
                                  <strong>Comment:</strong>{" "}
                                  {entry.comments[0].optionalComment}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Form */}
          <CompetencyReviewForm
            selectedEntry={selectedEntry}
            onAssessmentSubmit={handleAssessmentSubmit}
            submitting={submitting}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
