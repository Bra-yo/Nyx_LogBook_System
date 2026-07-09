"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { terminology } from "@/lib/terminology";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Send,
  Edit2,
} from "lucide-react";
import Link from "next/link";

interface LogbookEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  submittedAt?: string;
}

interface Assessment {
  id: string;
  status: string;
  competencyLevel?: number;
  comment?: string;
  mentor?: {
    user: { name: string };
  };
  lecturer?: {
    user: { name: string };
  };
}

interface MilestoneData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  entryCount: number;
  entries: LogbookEntry[];
  mentorAssessment?: Assessment;
  lecturerAssessment?: Assessment;
  createdAt: string;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "SUBMITTED":
      return "outline";
    case "MENTOR_REVIEWED":
      return "default";
    case "LECTURER_REVIEWED":
      return "default";
    case "COMPLETED":
      return "default";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Draft";
    case "IN_PROGRESS":
      return "In Progress";
    case "SUBMITTED":
      return "Awaiting Mentor Review";
    case "MENTOR_REVIEWED":
      return "Mentor Reviewed";
    case "LECTURER_REVIEWED":
      return "Lecturer Reviewed";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

export default function MilestoneDetailPage() {
  const router = useRouter();
  const params = useParams();
  const milestoneId = params.id as string;

  const [milestone, setMilestone] = useState<MilestoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMilestone();
  }, [milestoneId]);

  const fetchMilestone = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/milestones/${milestoneId}`);

      if (!response.ok) {
        setError("Failed to load milestone");
        return;
      }

      const data = await response.json();
      setMilestone(data.milestone);
    } catch (err) {
      console.error("Error fetching milestone:", err);
      setError("An error occurred while loading the milestone");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!milestone) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/student/milestones/${milestoneId}/submit`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Failed to submit milestone");
        return;
      }

      // Update milestone state
      setMilestone(data.milestone);

      // Show success message
      router.refresh();
    } catch (err) {
      console.error("Error submitting milestone:", err);
      setError("An error occurred while submitting the milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <DashboardLayout title={terminology.milestone}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!milestone) {
    return (
      <DashboardLayout title={terminology.milestone}>
        <div className="space-y-6">
          <Link href="/student/milestones">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {terminology.milestones}
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Competency milestone not found"}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={milestone.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link href="/student/milestones">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{milestone.title}</h2>
                <Badge variant={getStatusBadgeVariant(milestone.status)}>
                  {getStatusLabel(milestone.status)}
                </Badge>
              </div>
              {milestone.description && (
                <p className="text-muted-foreground">{milestone.description}</p>
              )}
            </div>
          </div>
          {milestone.status === "PENDING" && (
            <Link href={`/student/milestones/${milestoneId}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Milestone Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Competency Milestone Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-1">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(milestone.startDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(milestone.endDate)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Created</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(milestone.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logbook Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attached Work Records
            </CardTitle>
            <CardDescription>
              Entries dated between {formatDate(milestone.startDate)} and{" "}
              {formatDate(milestone.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {milestone.entries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No work records in this date range yet
                </p>
                <Link href="/student/logbook/new">
                  <Button size="sm">Create Work Record</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {milestone.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{entry.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entry.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        {formatDate(entry.date)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Status */}
        {(milestone.mentorAssessment || milestone.lecturerAssessment) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assessment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestone.mentorAssessment && (
                <div className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Mentor Review</p>
                    <p className="text-sm text-muted-foreground">
                      Reviewed by{" "}
                      {milestone.mentorAssessment.mentor?.user.name || "Mentor"}
                    </p>
                    {milestone.mentorAssessment.competencyLevel && (
                      <p className="text-sm mt-1">
                        Competency Level:{" "}
                        <span className="font-medium">
                          {milestone.mentorAssessment.competencyLevel}/5
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
              {milestone.lecturerAssessment && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Lecturer Assessment</p>
                    <p className="text-sm text-muted-foreground">
                      Assessed by{" "}
                      {milestone.lecturerAssessment.lecturer?.user.name ||
                        "Lecturer"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Section */}
        {milestone.status === "PENDING" && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Ready to Submit?</CardTitle>
              <CardDescription>
                Submit this competency milestone for mentor review once you have
                added work records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestone.entryCount === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This competency milestone needs at least one logbook entry
                      before it can be submitted
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || milestone.entryCount === 0}
                  className="gap-2"
                  size="lg"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Submitting..." : "Submit for Mentor Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {milestone.status === "SUBMITTED" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This competency milestone has been submitted and is awaiting
              mentor review. You cannot make changes until the mentor completes
              their assessment.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}
