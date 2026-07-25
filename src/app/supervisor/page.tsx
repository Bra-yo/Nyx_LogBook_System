"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TimeGreeting } from "@/components/common/time-greeting";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Folder,
  Plus,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { MetricCard, ProgressMeter, RiskBadge } from "@/components/supervisor/mentorship-performance-card";
import { type MentorDashboardSummary } from "@/lib/services/mentor-performance";

interface DashboardStats {
  totalStudents: number;
  pendingReviews: number;
  approvedToday: number;
  weeklySubmissions: number;
}

interface RecentActivityItem {
  id: string;
  studentName: string;
  entryTitle: string;
  status: string;
  submittedAt: string;
}

interface DashboardApiResponse {
  stats?: {
    totalLearners?: number;
    pendingReviews?: number;
    approvedToday?: number;
    weeklySubmissions?: number;
  };
  summary?: MentorDashboardSummary;
  recentEntries?: Array<{
    id: string;
    title: string;
    status?: string | null;
    createdAt: string;
    student: {
      user: {
        name: string;
      };
    };
  }>;
}

export default function SupervisorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingReviews: 0,
    approvedToday: 0,
    weeklySubmissions: 0,
  });

  const [dashboardSummary, setDashboardSummary] = useState<MentorDashboardSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const dashboardResponse = await fetch("/api/supervisor/dashboard");

        if (dashboardResponse.ok) {
          const dashboardData = (await dashboardResponse.json()) as DashboardApiResponse;
          if (!isMounted) {
            return;
          }

          setStats({
            totalStudents: dashboardData.stats?.totalLearners || 0,
            pendingReviews: dashboardData.stats?.pendingReviews || 0,
            approvedToday: dashboardData.stats?.approvedToday || 0,
            weeklySubmissions: dashboardData.stats?.weeklySubmissions || 0,
          });

          setDashboardSummary(dashboardData.summary || null);
          setRecentActivity(
            (dashboardData.recentEntries || []).map((entry) => ({
              id: entry.id,
              studentName: entry.student.user.name,
              entryTitle: entry.title,
              status: entry.status?.toLowerCase() || "pending",
              submittedAt: new Date(entry.createdAt).toLocaleDateString(),
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Supervisor Dashboard">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mentor Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <TimeGreeting userName={session?.user?.name} />
            <p className="text-muted-foreground">
              Monitor mentee growth, identify risk early, and keep mentorship sessions on track.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/supervisor/review">
              <Button>
                <Eye className="mr-2 h-4 w-4" />
                Review Pending Entries
              </Button>
            </Link>
            <Link href="/supervisor/students">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                View Mentees
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Assigned Mentees" value={dashboardSummary?.totalAssignedMentees ?? stats.totalStudents} subtitle="Learners aligned to your mentorship" icon={<Users className="h-4 w-4" />} />
          <MetricCard title="Active Mentees" value={dashboardSummary?.activeMentees ?? 0} subtitle="Progressing above the threshold" icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
          <MetricCard title="Upcoming Sessions" value={dashboardSummary?.upcomingMentorshipSessions ?? 0} subtitle="Planned mentorship touchpoints" icon={<CalendarDays className="h-4 w-4" />} />
          <MetricCard title="Pending Reviews" value={dashboardSummary?.pendingReviews ?? stats.pendingReviews} subtitle="Awaiting your attention" icon={<Clock className="h-4 w-4" />} tone="warning" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Average Attendance" value={`${dashboardSummary?.averageAttendance ?? 0}%`} subtitle="Attendance performance" icon={<CheckCircle className="h-4 w-4" />} />
          <MetricCard title="Average Task Completion" value={`${dashboardSummary?.averageTaskCompletion ?? 0}%`} subtitle="Task completion across mentees" icon={<FileText className="h-4 w-4" />} />
          <MetricCard title="Average Worklog Completion" value={`${dashboardSummary?.averageWorklogCompletion ?? 0}%`} subtitle="Worklogs submitted" icon={<TrendingUp className="h-4 w-4" />} />
          <MetricCard title="Overall Progress" value={`${dashboardSummary?.overallProgressAverage ?? 0}%`} subtitle="Mentorship health index" icon={<AlertTriangle className="h-4 w-4" />} tone="success" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mentorship Health Snapshot</CardTitle>
                  <CardDescription>Colour-coded indicators for support, progress, and intervention needs.</CardDescription>
                </div>
                <Badge variant="secondary">Live indicators</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardSummary ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Average Programme Progress</p>
                        <RiskBadge status={dashboardSummary.averageAttendance >= 70 ? "GREEN" : dashboardSummary.averageAttendance >= 50 ? "AMBER" : "RED"} />
                      </div>
                      <div className="mt-3">
                        <ProgressMeter label="Overall progress" value={dashboardSummary.overallProgressAverage} tone={dashboardSummary.overallProgressAverage >= 70 ? "success" : dashboardSummary.overallProgressAverage >= 50 ? "warning" : "danger"} />
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Needs follow-up</p>
                        <Badge variant="outline">{Math.max(0, stats.totalStudents - (dashboardSummary.activeMentees || 0))} learners</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Mentorship risk is automatically derived from attendance, task completion, worklogs, and competency pace.</p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Mentorship signals</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded border bg-background p-3">
                        <p className="text-xs uppercase text-muted-foreground">Attendance</p>
                        <p className="mt-1 text-xl font-semibold">{dashboardSummary.averageAttendance}%</p>
                      </div>
                      <div className="rounded border bg-background p-3">
                        <p className="text-xs uppercase text-muted-foreground">Tasks</p>
                        <p className="mt-1 text-xl font-semibold">{dashboardSummary.averageTaskCompletion}%</p>
                      </div>
                      <div className="rounded border bg-background p-3">
                        <p className="text-xs uppercase text-muted-foreground">Worklogs</p>
                        <p className="mt-1 text-xl font-semibold">{dashboardSummary.averageWorklogCompletion}%</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading mentorship insights…</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest learner records requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No recent activity found.
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{activity.studentName}</p>
                        <p className="text-xs text-muted-foreground">{activity.entryTitle}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.status === "approved" ? "secondary" : activity.status === "pending" ? "outline" : "destructive"}>{activity.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{activity.submittedAt}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Move quickly from overview to mentorship follow-up.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Link href="/supervisor/projects">
                <Button variant="outline" className="w-full justify-start">
                  <Folder className="mr-2 h-4 w-4" />
                  Manage Projects
                </Button>
              </Link>
              <Link href="/supervisor/projects/new">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
              <Link href="/supervisor/students">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View All Learners
                </Button>
              </Link>
              <Link href="/supervisor/review">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Review Pending Entries
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
