"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  FileText,
  Users,
} from "lucide-react";

interface AnalyticsPayload {
  analytics?: {
    learners?: number;
    mentors?: number;
    projects?: number;
    learningAreas?: number;
    competencies?: number;
    learningPaths?: number;
    assessments?: number;
    logbooks?: number;
    evidence?: number;
    portfolioCompletion?: number;
    averageCompetencyScore?: number;
    completionRate?: number;
    recentActivity?: Array<{ title: string; detail: string }>;
  };
  insights?: Array<{ label: string; value: string }>;
  recommendations?: Array<{ title: string; detail: string }>;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalSupervisors: 0,
    totalLecturers: 0,
    totalWorkers: 0,
    totalLogbookEntries: 0,
    pendingReviews: 0,
  });
  const [insights, setInsights] = useState<Array<{ label: string; value: string }>>([]);
  const [recommendations, setRecommendations] = useState<Array<{ title: string; detail: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) throw new Error("Failed to load analytics");

      const data: AnalyticsPayload = await response.json();
      const analytics = data.analytics ?? {};

      setStats({
        totalUsers: (analytics.learners ?? 0) + (analytics.mentors ?? 0),
        totalStudents: analytics.learners ?? 0,
        totalSupervisors: analytics.mentors ?? 0,
        totalLecturers: 0,
        totalWorkers: 0,
        totalLogbookEntries: analytics.logbooks ?? 0,
        pendingReviews: Math.max(0, (analytics.logbooks ?? 0) - (analytics.assessments ?? 0)),
      });
      setInsights(data.insights ?? []);
      setRecommendations(data.recommendations ?? []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAnalytics = () => {
      void fetchAnalytics();
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
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
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <p className="text-muted-foreground">
            Overview of platform usage and performance metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Students
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                WorkLog Records
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalLogbookEntries}
              </div>
              <p className="text-xs text-muted-foreground">
                Total work records submitted
              </p>
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
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* User Distribution */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown of users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Students</span>
                  <span className="text-sm font-bold">
                    {stats.totalStudents}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Supervisors</span>
                  <span className="text-sm font-bold">
                    {stats.totalSupervisors}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lecturers</span>
                  <span className="text-sm font-bold">
                    {stats.totalLecturers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Workers</span>
                  <span className="text-sm font-bold">
                    {stats.totalWorkers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Admins</span>
                  <span className="text-sm font-bold">
                    {stats.totalUsers -
                      stats.totalStudents -
                      stats.totalSupervisors -
                      stats.totalLecturers -
                      stats.totalWorkers}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Response Time</span>
                  <span className="text-sm font-bold text-green-600">
                    120ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Status</span>
                  <span className="text-sm font-bold text-green-600">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Sessions</span>
                  <span className="text-sm font-bold">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Uptime</span>
                  <span className="text-sm font-bold text-green-600">
                    99.9%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Executive Insights</CardTitle>
              <CardDescription>Key takeaways from the platform analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight) => (
                    <div key={insight.label} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{insight.label}</span>
                      <span className="text-sm font-bold">{insight.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No insights are available yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Focus Areas</CardTitle>
              <CardDescription>Actions that will improve completion and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.map((recommendation) => (
                    <div key={recommendation.title} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{recommendation.title}</p>
                      <p className="text-xs text-muted-foreground">{recommendation.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recommendations are available yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
