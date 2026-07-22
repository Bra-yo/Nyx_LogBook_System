"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  Eye,
  Folder,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { getLogbookDisplayStatus } from "@/lib/logbook-status";

export default function SupervisorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    approvedToday: 0,
    weeklySubmissions: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, cohortsResponse] = await Promise.all([
        fetch("/api/supervisor/dashboard"),
        fetch("/api/supervisor/cohorts"),
      ]);

      if (cohortsResponse.ok) {
        const cohortsData = await cohortsResponse.json();
        setCohorts(cohortsData.cohorts || []);
      }

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setStats((prev) => ({
          ...prev,
          totalStudents: dashboardData.stats?.totalLearners || 0,
          pendingReviews: dashboardData.stats?.pendingReviews || 0,
          approvedToday: dashboardData.stats?.approvedToday || 0,
          weeklySubmissions: dashboardData.stats?.weeklySubmissions || 0,
        }));

        setRecentActivity(
          (dashboardData.recentEntries || []).map((entry: any) => ({
            id: entry.id,
            studentName: entry.student.user.name,
            entryTitle: entry.title,
            status: getLogbookDisplayStatus(entry).toLowerCase(),
            submittedAt: new Date(entry.createdAt).toLocaleDateString(),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
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
        <div className="flex items-center justify-between">
          <div>
            <TimeGreeting userName={session?.user?.name} />
            <p className="text-muted-foreground">
              Review and manage learner work records
            </p>
          </div>
          <Link href="/supervisor/review">
            <Button>
              <Eye className="mr-2 h-4 w-4" />
              Review Pending Learner Entries
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Learners
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Assigned Learners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingReviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting your review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approved Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approvedToday}
              </div>
              <p className="text-xs text-muted-foreground">
                Entries reviewed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Submissions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.weeklySubmissions}
              </div>
              <p className="text-xs text-muted-foreground">This week's total</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Cohorts</CardTitle>
              <CardDescription>View your assigned cohorts and their mentees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cohorts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cohorts assigned yet.</p>
              ) : (
                cohorts.map((cohort: any) => (
                  <div key={cohort.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cohort.name}</p>
                        <p className="text-sm text-muted-foreground">{cohort.code}</p>
                      </div>
                      <Badge variant="secondary">{cohort.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>Total Mentees: {cohort._count?.members ?? 0}</span>
                      <span>Active Mentees: {cohort.members?.filter((member: any) => member.user)?.length ?? 0}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest learner work records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No recent activity found.</p>
                  </div>
                ) : (
                  recentActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.status === "approved"
                            ? "bg-green-500"
                            : activity.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {activity.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.entryTitle}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.submittedAt}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common mentor tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
                    Review Pending Learner Entries
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
