"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TimeGreeting } from "@/components/common/time-greeting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";
import { getLogbookDisplayStatus } from "@/lib/logbook-status";
import { LogStatus } from "@/types";

interface LogbookEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  status: LogStatus;
  comments?: Array<{
    status: string;
    createdAt: string;
  }>;
  assessments?: {
    status: string;
    assessedAt?: string;
  };
}

interface DashboardStats {
  totalEntries: number;
  approvedEntries: number;
  pendingReviews: number;
  draftEntries: number;
  progressPercentage: number;
}

interface ProjectTask {
  status?: string | null;
}

interface ProjectMilestone {
  tasks: ProjectTask[];
}

interface ProjectData {
  milestones: ProjectMilestone[];
}

interface DashboardEntry extends LogbookEntry {
  displayStatus: LogStatus;
}

interface WorkDashboardProps {
  layoutTitle: string;
  heroTitle?: string;
  heroDescription?: string;
  createHref?: string;
  workRecordsHref?: string;
  calendarHref?: string;
  reportsHref?: string;
  entriesApiPath: string;
  projectsApiPath: string;
  createButtonLabel?: string;
  workRecordsButtonLabel?: string;
  calendarButtonLabel?: string;
  reportsButtonLabel?: string;
}

export function WorkDashboard({
  layoutTitle,
  heroTitle,
  heroDescription,
  createHref,
  workRecordsHref,
  calendarHref,
  reportsHref,
  entriesApiPath,
  projectsApiPath,
  createButtonLabel = "New Work Record",
  workRecordsButtonLabel = "View All Work Records",
  calendarButtonLabel = "View Calendar",
  reportsButtonLabel = "Generate Report",
}: WorkDashboardProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    approvedEntries: 0,
    pendingReviews: 0,
    draftEntries: 0,
    progressPercentage: 0,
  });
  const [recentActivity, setRecentActivity] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [entriesResponse, projectsResponse] = await Promise.all([
        fetch(entriesApiPath),
        fetch(projectsApiPath),
      ]);

      let entries: LogbookEntry[] = [];
      let projectTasks: ProjectTask[] = [];

      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        entries = entriesData.entries || [];
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projects: ProjectData[] = projectsData.projects || [];
        projectTasks = projects.flatMap((project) =>
          project.milestones.flatMap((milestone) => milestone.tasks),
        );
      }

      const entriesWithDisplayStatus: DashboardEntry[] = entries.map(
        (entry) => ({
          ...entry,
          displayStatus: getLogbookDisplayStatus(entry),
        }),
      );

      const completedTasks = projectTasks.filter((task) =>
        ["COMPLETED", "VERIFIED"].includes(task.status || ""),
      ).length;
      const totalTasks = projectTasks.length;
      const progressPercentage =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      const calculatedStats: DashboardStats = {
        totalEntries: entries.length,
        approvedEntries: entriesWithDisplayStatus.filter(
          (entry) => entry.displayStatus === LogStatus.APPROVED,
        ).length,
        pendingReviews: entriesWithDisplayStatus.filter(
          (entry) => entry.displayStatus === LogStatus.PENDING,
        ).length,
        draftEntries: entries.filter(
          (entry) => entry.status === LogStatus.DRAFT,
        ).length,
        progressPercentage,
      };

      setStats(calculatedStats);
      setRecentActivity(entriesWithDisplayStatus.slice(0, 3));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [entriesApiPath, projectsApiPath]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDashboardData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboardData]);

  return (
    <DashboardLayout title={layoutTitle}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <TimeGreeting userName={session?.user?.name} />
              {heroTitle ? (
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  {heroTitle}
                </h2>
              ) : null}
              {heroDescription ? (
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  {heroDescription}
                </p>
              ) : null}
            </div>
            {createHref ? (
              <Link href={createHref} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  {createButtonLabel}
                </Button>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Work Records
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  stats.totalEntries
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                All time work records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-green-600">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  stats.approvedEntries
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Successfully reviewed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-yellow-600">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  stats.pendingReviews
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  `${stats.progressPercentage}%`
                )}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: loading ? "0%" : `${stats.progressPercentage}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Project progress
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest work records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No work records yet.
                  {createHref ? (
                    <>
                      <br />
                      <Link
                        href={createHref}
                        className="text-primary hover:underline"
                      >
                        Create your first work record
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((entry) => (
                    <div key={entry.id} className="flex items-center space-x-4">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          entry.status === "APPROVED"
                            ? "bg-green-500"
                            : entry.status === "PENDING"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {entry.description}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {createHref ? (
                  <Link href={createHref}>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      {createButtonLabel}
                    </Button>
                  </Link>
                ) : null}
                {workRecordsHref ? (
                  <Link href={workRecordsHref}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      {workRecordsButtonLabel}
                    </Button>
                  </Link>
                ) : null}
                {calendarHref ? (
                  <Link href={calendarHref}>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {calendarButtonLabel}
                    </Button>
                  </Link>
                ) : null}
                {reportsHref ? (
                  <Link href={reportsHref}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      {reportsButtonLabel}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
