"use client";

import { useEffect, useState } from "react";
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
import { Calendar, Folder, FileText, CheckCircle, TrendingUp, Users, BrainCircuit } from "lucide-react";

interface ProjectTask {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  dueDate?: string | null;
}

interface ProjectMilestone {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  tasks: ProjectTask[];
}

interface LearnerProject {
  id: string;
  title: string;
  description?: string | null;
  companyName?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  completionPercentage: number;
  completedMilestones: number;
  completedTasks: number;
  totalTasks: number;
  mentor?: { id: string; name: string } | null;
  learningArea?: { name: string } | null;
  milestones: ProjectMilestone[];
  recentLogbooks?: Array<{ id: string; title: string; status: string; createdAt: string; date: string; hoursWorked?: number | null }>;
  latestActivity?: { id: string; title: string; status: string; createdAt: string } | null;
}

export default function StudentProjectsPage() {
  const [projects, setProjects] = useState<LearnerProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/student/projects");
        if (!response.ok) {
          console.error("Failed to fetch projects");
          return;
        }

        const data = await response.json();
        if (isMounted) {
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Error fetching student projects:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout title="My Projects">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-muted-foreground">
              Track competency-based projects, milestone delivery, and learning-path progress.
            </p>
          </div>
          <Link href="/student/logbook/new">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              New Work Record
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{projects.filter((project) => project.status === "ACTIVE").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{projects.reduce((sum, project) => sum + project.completedMilestones, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{Math.round(projects.reduce((sum, project) => sum + project.completionPercentage, 0) / Math.max(1, projects.length))}%</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="h-40" />
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
              <Folder className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  No projects have been assigned to you yet.
                </h3>
                <p className="text-muted-foreground mb-4">
                  Please contact your Mentor to assign you to a project.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>
                        {project.companyName || "No company provided"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{project.status}</Badge>
                      <span className="font-medium">{project.completionPercentage}% complete</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><BrainCircuit className="h-4 w-4" /> Learning path</div>
                      <div className="mt-2 text-sm">{project.learningArea?.name || "No learning area linked yet"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Users className="h-4 w-4" /> Mentor</div>
                      <div className="mt-2 text-sm">{project.mentor?.name || "Pending allocation"}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><TrendingUp className="h-4 w-4" /> Latest activity</div>
                      <div className="mt-2 text-sm">{project.latestActivity?.title || "No recent activity"}</div>
                    </div>
                  </div>
                  {project.milestones.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No milestones have been assigned to this project yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {project.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="rounded-lg border p-4 bg-surface"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {milestone.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {milestone.description ||
                                  "No description provided"}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {milestone.status}
                            </Badge>
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground flex flex-wrap gap-2">
                            <span>
                              <Calendar className="inline h-4 w-4" />{" "}
                              {formatDate(milestone.startDate)} —{" "}
                              {formatDate(milestone.endDate)}
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <CheckCircle className="h-4 w-4" />
                              Tasks
                            </div>
                            {milestone.tasks.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No tasks added for this milestone yet.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {milestone.tasks.map((task) => (
                                  <li
                                    key={task.id}
                                    className="rounded-lg border p-3"
                                  >
                                    <div className="font-medium">
                                      {task.title}
                                    </div>
                                    {task.description && (
                                      <div className="text-sm text-muted-foreground">
                                        {task.description}
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Status: {task.status || "Unknown"}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
