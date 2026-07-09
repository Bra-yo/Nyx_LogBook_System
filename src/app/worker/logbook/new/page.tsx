"use client";

import { useState, useEffect } from "react";
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
}

export default function WorkerLogbookNewPage() {
  const router = useRouter();
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAttendance = async () => {
      try {
        setCheckingAttendance(true);

        const attendanceResponse = await fetch("/api/worker/attendance");
        if (!attendanceResponse.ok) {
          throw new Error("Attendance check failed");
        }

        const attendanceData = await attendanceResponse.json();

        if (!attendanceData.hasAttendanceToday) {
          router.push("/worker/attendance?redirect=/worker/logbook/new");
          return;
        }
      } catch (error) {
        console.error("Error checking attendance:", error);
      } finally {
        setCheckingAttendance(false);
      }
    };

    void verifyAttendance();
  }, [router]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/worker/projects");
        if (!res.ok) return;
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };
    void fetchProjects();
  }, []);

  const handleInputChange = (
    field: keyof WorkerLogbookFormData,
    value: string | Date | string[],
  ) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          [field]: value,
        }) as WorkerLogbookFormData,
    );
  };

  const handleDateChange = (dateString: string) => {
    setFormData((prev) => ({
      ...prev,
      date: new Date(dateString),
    }));
  };

  const canSubmit =
    formData.title.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.activities.trim() !== "";

  const handleSubmit = async (saveAsDraft: boolean = true) => {
    if (!selectedTaskId) {
      alert("Please select a task before saving a work record.");
      return;
    }
    if (!saveAsDraft && !canSubmit) {
      alert("Please fill in all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    try {
      const entryData = {
        taskId: selectedTaskId,
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

      const response = await fetch("/api/worker/logbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        router.push("/worker/logbook");
      } else {
        const errorData = await response.json();
        console.error("Error saving entry:", errorData);
        alert(errorData.error || "Failed to save work record");
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save work record");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAttendance) {
    return (
      <DashboardLayout title="New Work Record">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="New Work Record">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/worker/logbook">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">New Work Record</h2>
              <p className="text-muted-foreground">
                Record your daily or weekly work activities
              </p>
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
                  Provide a summary of your work, activities, and learnings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="task">Task *</Label>
                    <select
                      id="task"
                      className="w-full rounded-md border px-3 py-2"
                      value={selectedTaskId ?? ""}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                    >
                      <option value="">Select task...</option>
                      {projects.map((p) =>
                        p.tasks?.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {p.title} — {t.taskTitle}
                          </option>
                        )),
                      )}
                    </select>
                  </div>
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

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursWorked">Hours Worked</Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="0.00"
                      value={formData.hoursWorked}
                      onChange={(e) =>
                        handleInputChange("hoursWorked", e.target.value)
                      }
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
