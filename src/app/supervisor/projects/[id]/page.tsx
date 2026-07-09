"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { Folder, Users, FileText, Plus } from "lucide-react";
import { terminology } from "@/lib/terminology";

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  companyName: string | null;
  status: string;
  department?: { name: string };
  learners: Array<{
    learner: {
      id: string;
      user: { name: string; email: string };
      department?: { name: string };
    };
  }>;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params as { id: string }).id;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; fullName?: string; email?: string }>
  >([]);

  // effect moved below fetchProject/fetchMembers definitions to satisfy lint

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/supervisor/projects/${projectId}/workers`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to load project members:", error);
    }
  };

  const searchWorkers = async (term: string) => {
    try {
      setWorkerSearch(term);
      const res = await fetch(
        `/api/supervisor/workers?search=${encodeURIComponent(term)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.workers || []);
      }
    } catch (error) {
      console.error("Worker search failed:", error);
    }
  };

  const addWorker = async (workerId: string) => {
    try {
      setAdding(true);
      const res = await fetch(`/api/supervisor/projects/${projectId}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchMembers();
        setSearchResults([]);
        setWorkerSearch("");
      } else {
        alert(data.error || "Unable to add worker");
      }
    } catch (error) {
      console.error("Failed to add worker:", error);
      alert("Failed to add worker");
    } finally {
      setAdding(false);
    }
  };

  const removeWorker = async (workerId: string) => {
    const confirm = window.confirm("Remove this worker from the project?");
    if (!confirm) return;
    try {
      const res = await fetch(`/api/supervisor/projects/${projectId}/workers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      if (res.ok) {
        await fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Unable to remove worker");
      }
    } catch (error) {
      console.error("Failed to remove worker:", error);
      alert("Failed to remove worker");
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supervisor/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project || null);
      } else {
        router.push("/supervisor/projects");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      router.push("/supervisor/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
    if (projectId) fetchMembers();
  }, [projectId]);

  return (
    <DashboardLayout title={project?.title || terminology.project}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Details</h1>
            <p className="text-muted-foreground">
              Review the project and its competency milestones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/supervisor/projects">Back to Projects</Link>
            </Button>
            <Button asChild>
              <Link href={`/supervisor/projects/${projectId}/milestones/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Competency Milestone
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !project ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Project not found or access denied.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-medium">Company</div>
                  <div>{project.companyName || "Not provided"}</div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-medium">Department</div>
                  <div>{project.department?.name || "Not specified"}</div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-medium">Status</div>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage project worker assignments (ERP-synced workers only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {members.length} workers assigned
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="Search workers"
                        value={workerSearch}
                        onChange={(e) => searchWorkers(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {members.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No workers assigned yet.
                      </div>
                    )}
                    {members.map((m) => (
                      <Card key={m.id} className="bg-slate-50">
                        <CardContent className="grid gap-1">
                          <div className="font-medium">
                            {m.worker.fullName ||
                              m.worker.user?.name ||
                              m.worker.id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {m.worker.user?.email || m.worker.email}
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeWorker(m.worker.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {searchResults.length > 0 && (
                    <div>
                      <h4 className="font-medium">Search results</h4>
                      <div className="grid gap-2 mt-2">
                        {searchResults.map((w) => (
                          <div
                            key={w.id}
                            className="flex items-center justify-between border rounded p-2"
                          >
                            <div>
                              <div className="font-medium">{w.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                {w.email}
                              </div>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                onClick={() => addWorker(w.id)}
                                disabled={adding}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Learners</CardTitle>
                <CardDescription>
                  {project.learners.length} learners assigned to this project
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {project.learners.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No learners have been assigned to this project yet.
                  </p>
                ) : (
                  project.learners.map((item) => (
                    <Card key={item.learner.id} className="bg-slate-50">
                      <CardContent className="grid gap-1">
                        <div className="font-medium">
                          {item.learner.user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.learner.user.email}
                        </div>
                        {item.learner.department && (
                          <div className="text-sm text-muted-foreground">
                            {item.learner.department.name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{terminology.milestones}</CardTitle>
                <CardDescription>
                  {project.milestones.length} competency milestones under this
                  project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.milestones.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No competency milestones have been added to this project
                    yet.
                  </div>
                ) : (
                  project.milestones.map((milestone) => (
                    <Card key={milestone.id} className="border">
                      <CardContent className="grid gap-2 md:grid-cols-2">
                        <div>
                          <div className="font-semibold">{milestone.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(milestone.startDate).toLocaleDateString()}{" "}
                            - {new Date(milestone.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="secondary">{milestone.status}</Badge>
                          <Link
                            href={`/supervisor/milestones/${milestone.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
