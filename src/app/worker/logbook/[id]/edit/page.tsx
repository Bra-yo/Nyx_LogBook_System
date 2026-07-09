"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Props {
  params: { id: string };
}

interface WorkerLogbookFormData {
  title: string;
  description: string;
  activities: string;
  challenges: string;
  learnings: string;
  date: Date;
  startTime: string;
  endTime: string;
  hoursWorked: string;
  attachments: string[];
  status: string;
}

export default function WorkerLogbookEntryEditPage({ params }: Props) {
  const router = useRouter();
  const { id } = params;
  const [formData, setFormData] = useState<WorkerLogbookFormData>({
    title: "",
    description: "",
    activities: "",
    challenges: "",
    learnings: "",
    date: new Date(),
    startTime: "",
    endTime: "",
    hoursWorked: "",
    attachments: [],
    status: "DRAFT",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/worker/logbook/${id}`);
        if (res.ok) {
          const data = await res.json();
          const e = data.entry;
          setFormData({
            title: e.title || "",
            description: e.description || "",
            activities: e.activities || "",
            challenges: e.challenges || "",
            learnings: e.learnings || "",
            date: e.date ? new Date(e.date) : new Date(),
            startTime: e.startTime
              ? new Date(e.startTime).toISOString().slice(11, 16)
              : "",
            endTime: e.endTime
              ? new Date(e.endTime).toISOString().slice(11, 16)
              : "",
            hoursWorked:
              e.hoursWorked !== undefined && e.hoursWorked !== null
                ? e.hoursWorked.toString()
                : "",
            attachments: e.attachments || [],
            status: e.status || "DRAFT",
          });
        } else {
          router.push("/worker/logbook");
        }
      } catch (err) {
        console.error(err);
        router.push("/worker/logbook");
      } finally {
        setLoading(false);
      }
    };

    void fetchEntry();
  }, [id, router]);

  const handleInputChange = (
    field: keyof WorkerLogbookFormData,
    value: string | Date | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, date: new Date(value) }));
  };

  const canSubmit =
    formData.title.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.activities.trim() !== "";

  const handleSubmit = async (saveAsDraft: boolean = true) => {
    if (!saveAsDraft && !canSubmit) {
      alert("Please fill in all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    try {
      const entryData = {
        workDate: formData.date.toISOString(),
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        hoursWorked: formData.hoursWorked
          ? Number(formData.hoursWorked)
          : undefined,
        progressDescription: `${formData.description}\n\n${formData.activities}`,
        achievements: formData.activities,
        challenges: formData.challenges,
        completionPercentage: undefined,
        status: saveAsDraft ? "DRAFT" : "PENDING",
      };

      const response = await fetch(`/api/worker/logbook/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        router.push("/worker/logbook");
      } else {
        const errorData = await response.json();
        console.error("Error updating entry:", errorData);
        alert(errorData.error || "Failed to update work record");
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update work record");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Work Record">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Work Record">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/worker/logbook/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">Edit Work Record</h2>
              <p className="text-muted-foreground">Modify your work record</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting && isDraft ? "Saving..." : "Save as Draft"}
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting && !isDraft ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Entry Details</CardTitle>
                <CardDescription>
                  Provide a summary of your work record and how it was
                  completed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Daily Site Inspection"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={format(formData.date, "yyyy-MM-dd")}
                      onChange={(e) => handleDateChange(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of what you worked on..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activities">Activities *</Label>
                  <Textarea
                    id="activities"
                    placeholder="List the specific activities you performed..."
                    value={formData.activities}
                    onChange={(e) =>
                      handleInputChange("activities", e.target.value)
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenges">Challenges (Optional)</Label>
                  <Textarea
                    id="challenges"
                    placeholder="Any challenges you faced and how you overcame them..."
                    value={formData.challenges}
                    onChange={(e) =>
                      handleInputChange("challenges", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learnings">Learnings (Optional)</Label>
                  <Textarea
                    id="learnings"
                    placeholder="What did you learn from this experience?"
                    value={formData.learnings}
                    onChange={(e) =>
                      handleInputChange("learnings", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Upload files related to this entry (coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="text-muted-foreground">
                    <p>File upload functionality</p>
                    <p className="text-sm">
                      Will be implemented in a future update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Be Specific</p>
                  <p>Include concrete details about your work.</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Focus on Results
                  </p>
                  <p>Describe the impact of the tasks you completed.</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Keep it Clear</p>
                  <p>Use simple language so reviewers can assess quickly.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
