"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  CheckCircle,
  TrendingUp,
  Clock
} from "lucide-react"

interface AnalyticsPayload {
  analytics?: {
    assignedLearners?: number;
    activeLearningPaths?: number;
    pendingReviews?: number;
    completedReviews?: number;
    assessmentCompletionRate?: number;
    averageLearnerGrowth?: number;
    projectsSupervised?: number;
    workload?: number;
    capacityUtilization?: number;
  };
  insights?: Array<{ label: string; value: string }>;
  recommendations?: Array<{ title: string; detail: string }>;
  capacity?: number;
  learningPaths?: number;
}

export default function SupervisorAnalyticsPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    completedReviews: 0,
    averageRating: 0
  })
  const [insights, setInsights] = useState<Array<{ label: string; value: string }>>([])
  const [recommendations, setRecommendations] = useState<Array<{ title: string; detail: string }>>([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/supervisor/analytics')
      if (!response.ok) throw new Error('Failed to load analytics')

      const data: AnalyticsPayload = await response.json()
      const analytics = data.analytics ?? {}

      setStats({
        totalStudents: analytics.assignedLearners ?? 0,
        pendingReviews: analytics.pendingReviews ?? 0,
        completedReviews: analytics.completedReviews ?? 0,
        averageRating: analytics.assessmentCompletionRate ?? 0,
      })
      setInsights(data.insights ?? [])
      setRecommendations(data.recommendations ?? [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadAnalytics = () => {
      void fetchAnalytics()
    }

    loadAnalytics()
  }, [])

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
    )
  }

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your supervision activities and student performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Assigned Learners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Reviews</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedReviews}</div>
              <p className="text-xs text-muted-foreground">
                Total reviews completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Student competency score
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Review Activity</CardTitle>
              <CardDescription>
                Current review volume and supervision workload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending reviews</span>
                  <span className="text-sm font-bold text-yellow-600">{stats.pendingReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed reviews</span>
                  <span className="text-sm font-bold text-green-600">{stats.completedReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Assessment completion</span>
                  <span className="text-sm font-bold">{stats.averageRating}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mentor Insights</CardTitle>
              <CardDescription>
                Summary of mentor capacity and learner engagement
              </CardDescription>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Focus Areas</CardTitle>
            <CardDescription>
              Suggested actions to support your learners effectively
            </CardDescription>
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
    </DashboardLayout>
  )
}
