"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Edit, Layers, Archive } from "lucide-react";
import { format } from "date-fns";
import { getLogbookDisplayStatus, getStatusBadgeProps } from "@/lib/logbook-status";
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
  submittedAt?: string;
  reviewedAt?: string;
  hoursWorked?: number;
  learningPath?: {
    id: string;
    competency: {
      name: string;
      code: string;
      learningArea: {
        name: string;
      };
    };
  };
  project?: { id: string; title: string };
  milestone?: { id: string; title: string };
  milestoneTask?: { id: string; title: string };
  evidenceItems?: Array<{ id: string; type: string; title?: string; url: string; description?: string }>;
  comments?: Array<{ competencyScore: number; competencyLabel: string; competencyDescription: string; optionalComment?: string; status: string; createdAt: string }>;
}

export default function StudentLogbookDetailPage() {
  const params = useParams();
  const entryId = params?.id as string;
  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEntry() {
      if (!entryId) {
        setError("Invalid entry identifier.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/student/logbook/${entryId}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setError(payload?.error || "Unable to load work record.");
          return;
        }

        const payload = (await response.json()) as { success?: boolean; entry?: LogbookEntry; error?: string };
        if (!payload.entry) {
          setError(payload.error || "Logbook entry not found.");
          return;
        }
        setEntry(payload.entry);
      } catch (err) {
        console.error("Error loading logbook entry:", err);
        setError("Failed to load logbook entry.");
      } finally {
        setLoading(false);
      }
    }

    void loadEntry();
  }, [entryId]);

  const latestAssessment = entry?.comments?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const displayStatus = entry ? getLogbookDisplayStatus(entry) : LogStatus.PENDING;
  const badgeProps = getStatusBadgeProps(displayStatus);

  return (
    <DashboardLayout title="WorkRecord Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/student/logbook">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">WorkRecord details</h2>
              <p className="text-sm text-muted-foreground">Review the competency, project, and evidence context for this entry.</p>
            </div>
          </div>
          {entry && (entry.status === LogStatus.DRAFT || entry.status === LogStatus.PENDING) ? (
            <Link href={`/student/logbook/${entry.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Record
              </Button>
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : entry ? (
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm">Status</CardTitle>
                    <Badge className={badgeProps.className}>{badgeProps.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Current review status for this entry.</p>
                  <div className="mt-4 text-lg font-semibold">{entry.status}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Date & Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(entry.date), "PPP")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    {typeof entry.hoursWorked === "number" ? `${entry.hoursWorked} hrs` : "No hours recorded"}
                  </div>
                  {entry.submittedAt ? (
                    <div>Submitted {format(new Date(entry.submittedAt), "PPP p")}</div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Learning Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {entry.learningPath ? (
                      <span>{entry.learningPath.competency.name} ({entry.learningPath.competency.code})</span>
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                  <div>
                    <strong>Project:</strong> {entry.project?.title ?? "None"}
                  </div>
                  <div>
                    <strong>Milestone:</strong> {entry.milestone?.title ?? "None"}
                  </div>
                  <div>
                    <strong>Task:</strong> {entry.milestoneTask?.title ?? "None"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Work summary</CardTitle>
                <CardDescription>Detailed entry description, activities, challenges, and learnings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                  <p className="mt-1 text-base font-semibold">{entry.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{entry.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Activities</h3>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{entry.activities}</p>
                </div>
                {entry.challenges ? (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Challenges</h3>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{entry.challenges}</p>
                  </div>
                ) : null}
                {entry.learnings ? (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Learnings</h3>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{entry.learnings}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {entry.evidenceItems && entry.evidenceItems.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Evidence</CardTitle>
                  <CardDescription>{entry.evidenceItems.length} item{entry.evidenceItems.length === 1 ? "" : "s"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entry.evidenceItems.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{item.title || item.type}</div>
                          <div className="text-sm text-muted-foreground">{item.type}</div>
                        </div>
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">
                          View
                        </a>
                      </div>
                      {item.description ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {latestAssessment ? (
              <Card>
                <CardHeader>
                  <CardTitle>Latest assessment</CardTitle>
                  <CardDescription>Competency assessment from the supervisor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <strong>Score:</strong> {latestAssessment.competencyScore}
                  </div>
                  <div>
                    <strong>Competency:</strong> {latestAssessment.competencyLabel}
                  </div>
                  <div>
                    <strong>Status:</strong> {latestAssessment.status}
                  </div>
                  {latestAssessment.optionalComment ? (
                    <div>
                      <strong>Comment:</strong> {latestAssessment.optionalComment}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
