"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Milestone {
  id: string;
  title: string;
}

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [projectMembers, setProjectMembers] = useState<
    Array<{
      id: string;
      worker: { id: string; user?: { name?: string; email?: string } };
    }>
  >([]);
  const [assignedWorkerId, setAssignedWorkerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expectedOutput: "",
    dueDate: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchMilestone();
    }
  }, [params.id]);

  const fetchMilestone = async () => {
    try {
      const response = await fetch(`/api/supervisor/milestones/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setMilestone(data.milestone);
        const projectId = data.milestone?.projectId;
        if (projectId) {
          const res = await fetch(
            `/api/supervisor/projects/${projectId}/workers`,
          );
          if (res.ok) {
            const d = await res.json();
            setProjectMembers(d.members || []);
          }
        }
      } else if (response.status === 404) {
        router.push("/supervisor/milestones");
      }
    } catch (error) {
      console.error("Failed to fetch milestone:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/supervisor/milestones/${params.id}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, assignedWorkerId }),
        },
      );

      if (response.ok) {
        toast.success("Task added successfully");
        router.push(`/supervisor/milestones/${params.id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add task");
      }
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  if (!milestone) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading milestone...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/supervisor/milestones/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Milestone
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Task</h1>
          <p className="text-muted-foreground">
            Add a new task to {milestone.title}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what needs to be accomplished"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedOutput">Expected Output</Label>
              <Textarea
                id="expectedOutput"
                value={formData.expectedOutput}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expectedOutput: e.target.value,
                  }))
                }
                placeholder="What should be delivered or achieved?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedWorker">Assign Worker (optional)</Label>
              <select
                id="assignedWorker"
                value={assignedWorkerId || ""}
                onChange={(e) => setAssignedWorkerId(e.target.value || null)}
                className="w-full border rounded px-2 py-2"
              >
                <option value="">-- No worker assigned --</option>
                {projectMembers.map((m) => (
                  <option key={m.id} value={m.worker.id}>
                    {m.worker.user?.name || m.worker.user?.email || m.worker.id}{" "}
                    {m.worker.user?.email ? `(${m.worker.user.email})` : ""}
                  </option>
                ))}
              </select>
              {projectMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No workers assigned to the project.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/supervisor/milestones/${params.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
