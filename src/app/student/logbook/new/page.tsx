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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  tasks: {
    id: string;
    title: string;
    description: string | null;
  }[];
}

export default function NewLogbookEntry() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activities: "",
    challenges: "",
    learnings: "",
    date: new Date(),
    milestoneId: "",
    milestoneTaskId: "",
    attachments: [] as string[],
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(true);

  useEffect(() => {
    checkAttendanceStatus();
    fetchMilestones();
  }, []);

  const checkAttendanceStatus = async () => {
    try {
      setCheckingAttendance(true);

      const attendanceResponse = await fetch("/api/attendance/active");
      const attendanceData = await attendanceResponse.json();

      if (!attendanceData.hasAttendanceToday) {
        router.push("/student/attendance?redirect=/student/logbook/new");
        return;
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const fetchMilestones = async () => {
    try {
      setLoadingMilestones(true);
      const response = await fetch("/api/student/milestones");
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error("Failed to fetch milestones:", error);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMilestoneChange = (milestoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      milestoneId,
      milestoneTaskId: "", // Reset task when milestone changes
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        date,
      }));
    }
  };

  const selectedMilestone = milestones.find(
    (m) => m.id === formData.milestoneId,
  );
  const canSubmit =
    formData.milestoneId &&
    formData.milestoneTaskId &&
    formData.title &&
    formData.description &&
    formData.activities;

  const handleSubmit = async (saveAsDraft: boolean = true) => {
    if (!saveAsDraft && !canSubmit) {
      alert(
        "Please fill in all required fields including milestone and task selection",
      );
      return;
    }

    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    try {
      const entryData = {
        ...formData,
        status: saveAsDraft ? "DRAFT" : "PENDING",
        submittedAt: saveAsDraft ? null : new Date(),
      };

      const response = await fetch("/api/student/logbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        // Redirect to logbook list
        router.push("/student/logbook");
      } else {
        const errorData = await response.json();
        console.error("Error saving entry:", errorData);
        // Show error message to user
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="New Logbook Entry">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/student/logbook">
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

        {/* Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Milestone and Task Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Milestone & Task Selection</CardTitle>
                <CardDescription>
                  Select the competency milestone and specific task you're
                  working on
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingMilestones ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading milestones...</span>
                  </div>
                ) : milestones.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No milestones available. Contact your mentor.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="milestone">Competency Milestone *</Label>
                      <Select
                        value={formData.milestoneId}
                        onValueChange={handleMilestoneChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a milestone" />
                        </SelectTrigger>
                        <SelectContent>
                          {milestones.map((milestone) => (
                            <SelectItem key={milestone.id} value={milestone.id}>
                              {milestone.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task">Task *</Label>
                      <Select
                        value={formData.milestoneTaskId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            milestoneTaskId: value,
                          }))
                        }
                        disabled={!formData.milestoneId}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              formData.milestoneId
                                ? "Select a task"
                                : "Select milestone first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedMilestone?.tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedMilestone && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium">{selectedMilestone.title}</h4>
                    {selectedMilestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedMilestone.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entry Details</CardTitle>
                <CardDescription>
                  Provide information about your internship activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Database Schema Design"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date
                            ? format(formData.date, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                  <p>Include concrete details about your work</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Focus on Learning
                  </p>
                  <p>Highlight what you gained from the experience</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Regular Updates</p>
                  <p>Submit entries frequently for better feedback</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
