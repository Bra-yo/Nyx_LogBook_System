"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Save, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
}

interface EvidenceItem {
  type: "DOCUMENT" | "IMAGE" | "VIDEO" | "LINK" | "SOURCE_CODE";
  title: string;
  url: string;
  description: string;
}

interface LogbookEntry {
  id: string;
  title: string;
  description: string;
  activities: string;
  challenges?: string;
  learnings?: string;
  date: string;
  status: string;
  hoursWorked?: number;
  learningPathId?: string;
  projectId?: string;
  milestoneId?: string;
  milestoneTaskId?: string;
  evidenceItems?: EvidenceItem[];
}

export default function EditLogbookEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params?.id as string;
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
    evidenceItems: [] as EvidenceItem[],
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    if (!entryId) return;

    try {
      setLoading(true);
      const [entryResponse, milestonesResponse, learningPathsResponse] = await Promise.all([
        fetch(`/api/student/logbook/${entryId}`),
        fetch("/api/student/milestones"),
        fetch("/api/student/learning-paths"),
      ]);

      if (!entryResponse.ok) {
        const payload = await entryResponse.json().catch(() => null);
        setError(payload?.error || "Unable to load logbook entry.");
        return;
      }

      const entryPayload = (await entryResponse.json()) as { success?: boolean; entry?: LogbookEntry; error?: string };
      if (!entryPayload.entry) {
        setError(entryPayload.error || "Work record not found.");
        return;
      }

      const milestonesPayload = await milestonesResponse.json();
      const learningPathsPayload = await learningPathsResponse.json();

      setMilestones(milestonesPayload.milestones || []);
      setLearningPaths(learningPathsPayload.learningPaths || []);
      setFormData({
        title: entryPayload.entry.title,
        description: entryPayload.entry.description,
        activities: entryPayload.entry.activities,
        challenges: entryPayload.entry.challenges ?? "",
        learnings: entryPayload.entry.learnings ?? "",
        date: new Date(entryPayload.entry.date),
        learningPathId: entryPayload.entry.learningPathId ?? "",
        projectId: entryPayload.entry.projectId ?? "",
        milestoneId: entryPayload.entry.milestoneId ?? "",
        milestoneTaskId: entryPayload.entry.milestoneTaskId ?? "",
        hoursWorked: entryPayload.entry.hoursWorked?.toString() ?? "",
        evidenceItems: entryPayload.entry.evidenceItems || [],
      });
    } catch (err) {
      console.error("Error loading edit data:", err);
      setError("Failed to load edit data.");
    } finally {
      setLoading(false);
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
      milestoneTaskId: "",
      projectId: selected?.projectId || "",
    }));
  };

  const handleEvidenceChange = (index: number, field: keyof EvidenceItem, value: string) => {
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
      evidenceItems: [...prev.evidenceItems, { type: "DOCUMENT", title: "", url: "", description: "" }],
    }));
  };

  const removeEvidenceItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidenceItems: prev.evidenceItems.filter((_, itemIndex) => itemIndex !== index),
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

  const selectedMilestone = milestones.find((m) => m.id === formData.milestoneId);
  const canSubmit =
    formData.learningPathId &&
    formData.milestoneId &&
    formData.milestoneTaskId &&
    formData.title &&
    formData.description &&
    formData.activities;

  const handleSave = async (saveAsDraft = true) => {
    if (!saveAsDraft && !canSubmit) {
      alert("Please fill in all required fields including milestone and task selection.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        learningPathId: formData.learningPathId,
        projectId: formData.projectId,
        milestoneId: formData.milestoneId,
        milestoneTaskId: formData.milestoneTaskId,
        title: formData.title,
        description: formData.description,
        activities: formData.activities,
        challenges: formData.challenges || undefined,
        learnings: formData.learnings || undefined,
        date: formData.date.toISOString(),
        hoursWorked: formData.hoursWorked ? Number(formData.hoursWorked) : undefined,
        status: saveAsDraft ? "DRAFT" : "PENDING",
        evidenceItems: formData.evidenceItems.length ? formData.evidenceItems : undefined,
      };

      const response = await fetch(`/api/student/logbook/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        setError(errorPayload?.error || "Failed to save work record.");
        return;
      }

      router.push("/student/logbook");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save work record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Work Record">
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Work Record">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/student/logbook">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">Edit Work Record</h2>
              <p className="text-sm text-muted-foreground">Update your entry before resubmitting for review.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void handleSave(true)} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button onClick={() => void handleSave(false)} disabled={saving}>
              <Send className="mr-2 h-4 w-4" />
              {saving ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competency and Project Details</CardTitle>
                <CardDescription>Select the learning path, milestone and task.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="learningPath">Learning Path *</Label>
                    <Select value={formData.learningPathId} onValueChange={(value) => handleInputChange("learningPathId", value)}>
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
                    <Label htmlFor="milestone">Milestone *</Label>
                    <Select value={formData.milestoneId} onValueChange={handleMilestoneChange}>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="task">Task *</Label>
                    <Select value={formData.milestoneTaskId} onValueChange={(value) => handleInputChange("milestoneTaskId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedMilestone?.tasks || []).map((task) => (
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
                      value={formData.hoursWorked}
                      onChange={(event) => handleInputChange("hoursWorked", event.target.value)}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entry Content</CardTitle>
                <CardDescription>Capture what you worked on, lessons learned, and any challenges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(event) => handleInputChange("title", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span>{format(formData.date, "PPP")}</span>
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formData.date} onSelect={handleDateChange} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(event) => handleInputChange("description", event.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activities">Activities *</Label>
                    <Textarea
                      id="activities"
                      value={formData.activities}
                      onChange={(event) => handleInputChange("activities", event.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="challenges">Challenges</Label>
                      <Textarea
                        id="challenges"
                        value={formData.challenges}
                        onChange={(event) => handleInputChange("challenges", event.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="learnings">Learnings</Label>
                      <Textarea
                        id="learnings"
                        value={formData.learnings}
                        onChange={(event) => handleInputChange("learnings", event.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence Items</CardTitle>
                <CardDescription>Add supporting links, documents, or code references.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.evidenceItems.map((item, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2 md:col-span-1">
                        <Label>Type</Label>
                        <Select
                          value={item.type}
                          onValueChange={(value) => handleEvidenceChange(index, "type", value as EvidenceItem["type"])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOCUMENT">Document</SelectItem>
                            <SelectItem value="IMAGE">Image</SelectItem>
                            <SelectItem value="VIDEO">Video</SelectItem>
                            <SelectItem value="LINK">Link</SelectItem>
                            <SelectItem value="SOURCE_CODE">Source Code</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label>Title</Label>
                        <Input
                          value={item.title}
                          onChange={(event) => handleEvidenceChange(index, "title", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={item.url}
                          onChange={(event) => handleEvidenceChange(index, "url", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(event) => handleEvidenceChange(index, "description", event.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeEvidenceItem(index)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addEvidenceItem}>
                  Add evidence item
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
