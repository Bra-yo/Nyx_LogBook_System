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
import {
  CalendarIcon,
  Save,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  tasks: {
    id: string;
    title: string;
    description: string | null;
  }[];
}

interface LearningPath {
  id: string;
  competency: {
    name: string;
    code: string;
    learningArea: {
      name: string;
    };
  };
  mentorAllocations: Array<{
    mentor: {
      user: {
        name: string;
        email: string;
      };
    };
  }>;
}

interface EvidenceItem {
  type: "DOCUMENT" | "IMAGE" | "VIDEO" | "LINK" | "SOURCE_CODE";
  title: string;
  url: string;
  description: string;
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
    learningPathId: "",
    projectId: "",
    milestoneId: "",
    milestoneTaskId: "",
    hoursWorked: "",
    attachments: [] as string[],
    evidenceItems: [] as EvidenceItem[],
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [loadingLearningPaths, setLoadingLearningPaths] = useState(true);

  useEffect(() => {
    checkAttendanceStatus();
    fetchMilestones();
    fetchLearningPaths();
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

  const fetchLearningPaths = async () => {
    try {
      setLoadingLearningPaths(true);
      const response = await fetch("/api/student/learning-paths");
      if (response.ok) {
        const data = await response.json();
        setLearningPaths(data.learningPaths || []);
      }
    } catch (error) {
      console.error("Failed to fetch active learning paths:", error);
    } finally {
      setLoadingLearningPaths(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMilestoneChange = (milestoneId: string) => {
    const selected = milestones.find((milestone) => milestone.id === milestoneId);
    setFormData((prev) => ({
      ...prev,
      milestoneId,
      milestoneTaskId: "", // Reset task when milestone changes
      projectId: selected?.projectId || "",
    }));
  };

  const handleLearningPathChange = (learningPathId: string) => {
    setFormData((prev) => ({
      ...prev,
      learningPathId,
    }));
  };

  const handleEvidenceChange = (
    index: number,
    field: keyof EvidenceItem,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      evidenceItems: prev.evidenceItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addEvidenceItem = () => {
    setFormData((prev) => ({
      ...prev,
      evidenceItems: [
        ...prev.evidenceItems,
        { type: "DOCUMENT", title: "", url: "", description: "" },
      ],
    }));
  };

  const removeEvidenceItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidenceItems: prev.evidenceItems.filter((_, itemIndex) =>
        itemIndex !== index,
      ),
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
    formData.learningPathId &&
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
        projectId: formData.projectId,
        hoursWorked: formData.hoursWorked
          ? Number(formData.hoursWorked)
          : undefined,
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
                      <Label htmlFor="learningPath">Learning Path *</Label>
                      <Select
                        value={formData.learningPathId}
                        onValueChange={handleLearningPathChange}
                        disabled={loadingLearningPaths}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a learning path" />
                        </SelectTrigger>
                        <SelectContent>
                          {learningPaths.map((path) => (
                            <SelectItem key={path.id} value={path.id}>
                              {path.competency.name} ({path.competency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="hoursWorked">Hours Worked</Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      min={0}
                      step={0.25}
                      placeholder="e.g., 8"
                      value={formData.hoursWorked}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hoursWorked: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

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
              <CardHeader className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Evidence Items</CardTitle>
                  <CardDescription>
                    Add links or documents that support your learning.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEvidenceItem}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Evidence
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.evidenceItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-muted/50 p-4 text-sm text-muted-foreground">
                    No evidence added yet. Attach a link, document, or media item.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.evidenceItems.map((item, index) => (
                      <div
                        key={index}
                        className="space-y-3 rounded-2xl border border-muted/20 bg-muted/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-medium">
                            Evidence item {index + 1}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEvidenceItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={item.type}
                              onValueChange={(value) =>
                                handleEvidenceChange(index, "type", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DOCUMENT">
                                  Document
                                </SelectItem>
                                <SelectItem value="IMAGE">Image</SelectItem>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="LINK">Link</SelectItem>
                                <SelectItem value="SOURCE_CODE">
                                  Source Code
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={item.title}
                              onChange={(e) =>
                                handleEvidenceChange(
                                  index,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Evidence title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              value={item.url}
                              onChange={(e) =>
                                handleEvidenceChange(
                                  index,
                                  "url",
                                  e.target.value,
                                )
                              }
                              placeholder="https://example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) =>
                                handleEvidenceChange(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                              rows={2}
                              placeholder="Optional description"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
