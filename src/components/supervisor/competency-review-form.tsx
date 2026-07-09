"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface LogbookEntry {
  id: string;
  title: string;
  description: string;
  activities: string;
  challenges?: string;
  learnings?: string;
  date: string;
  status: string;
  student: {
    user: {
      name: string;
      email: string;
    };
  };
  comments?: Array<{
    competencyLevel: number;
    competencyLabel: string;
    competencyDescription: string;
    optionalComment?: string;
    status: string;
    createdAt: string;
  }>;
  supervisorAssessment?: {
    competencyLevel: number;
    competencyLabel: string;
    competencyDescription: string;
    optionalComment?: string;
    status: string;
  };
}

const competencyLevels = [
  {
    value: 1,
    title: "Novice",
    description: "Unable to perform task without continuous guidance.",
  },
  {
    value: 2,
    title: "Beginner",
    description: "Performs task with substantial supervision.",
  },
  {
    value: 3,
    title: "Developing Competence",
    description: "Performs task with moderate supervision.",
  },
  {
    value: 4,
    title: "Competent",
    description: "Performs independently to acceptable workplace standards.",
  },
  {
    value: 5,
    title: "Proficient/Expert",
    description:
      "Performs independently, accurately, efficiently, and can mentor others.",
  },
];

interface CompetencyReviewFormProps {
  selectedEntry: LogbookEntry | null;
  onAssessmentSubmit: (
    entryId: string,
    score: number,
    comment: string,
    status: string,
  ) => Promise<void>;
  submitting: boolean;
}

export function CompetencyReviewForm({
  selectedEntry,
  onAssessmentSubmit,
  submitting,
}: CompetencyReviewFormProps) {
  const [selectedCompetencyLevel, setSelectedCompetencyLevel] = useState<
    number | null
  >(null);
  const [comment, setComment] = useState<string>("");

  // Debug: Log current state
  console.log("Current selected competency level:", selectedCompetencyLevel);

  // Preselect existing competency level when entry changes
  useEffect(() => {
    const id = setTimeout(() => {
      const latestComment = selectedEntry?.comments?.[0];
      if (latestComment?.competencyLevel) {
        setSelectedCompetencyLevel(latestComment.competencyLevel);
      } else {
        setSelectedCompetencyLevel(null);
      }
      setComment(selectedEntry?.supervisorAssessment?.optionalComment || "");
    }, 0);
    return () => clearTimeout(id);
  }, [selectedEntry]);

  const handleSubmitAssessment = async () => {
    if (!selectedEntry) return;
    if (!selectedCompetencyLevel) {
      // Show error - for now use console.error, could add toast
      console.error("Please select a competency level.");
      alert("Please select a competency level.");
      return;
    }
    console.log(
      "Submitting assessment with competency level:",
      selectedCompetencyLevel,
    );
    await onAssessmentSubmit(
      selectedEntry.id,
      selectedCompetencyLevel,
      comment,
      "APPROVED",
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-600">Pending Review</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "NEEDS_REVISION":
        return <Badge className="bg-orange-600">Needs Revision</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!selectedEntry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assess Entry</CardTitle>
          <CardDescription>
            Select a work record from the list to review and assess
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Entry Selected</h3>
            <p className="text-muted-foreground">
              Select a work record from the list to start reviewing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assess Entry</CardTitle>
        <CardDescription>
          Evaluate {selectedEntry.student.user.name}'s work record
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entry Details */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="font-medium mb-3">Entry Details</h3>
          <div className="grid gap-4 text-sm">
            <div>
              <span className="font-medium">Student:</span>{" "}
              {selectedEntry.student.user.name}
            </div>
            <div>
              <span className="font-medium">Date:</span>{" "}
              {format(new Date(selectedEntry.date), "MMMM dd, yyyy")}
            </div>
            <div>
              <span className="font-medium">Activity:</span>{" "}
              {selectedEntry.title}
            </div>
          </div>
        </div>

        {/* Competency Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Competency Level</Label>
          <div className="grid grid-cols-1 gap-3">
            {competencyLevels.map((level) => (
              <button
                type="button"
                key={level.value}
                onClick={() => {
                  console.log("Clicked competency level:", level.value);
                  setSelectedCompetencyLevel(level.value);
                }}
                className={`p-4 border rounded-lg cursor-pointer transition text-left w-full ${
                  selectedCompetencyLevel === level.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border hover:border-primary/60 hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      selectedCompetencyLevel === level.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    <span className="font-bold">{level.value}</span>
                  </div>
                  <div>
                    <div className="font-medium">{level.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {level.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Additional Comments (Optional)</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any additional feedback or notes..."
            rows={3}
          />
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label>Review Status</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setComment("");
                setSelectedCompetencyLevel(null);
              }}
              disabled={submitting}
            >
              Request Revision
            </Button>

            <Button
              variant={
                selectedCompetencyLevel && selectedCompetencyLevel >= 3
                  ? "default"
                  : "outline"
              }
              onClick={() => handleSubmitAssessment()}
              disabled={
                submitting || !selectedEntry || !selectedCompetencyLevel
              }
            >
              {submitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
