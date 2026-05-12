"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  CheckCircle,
  TrendingUp,
  Clock
} from "lucide-react"

export default function LecturerAnalyticsPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    averageScore: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/lecturer/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalStudents: data.overview?.totalStudents || 0,
          pendingAssessments: data.overview?.pendingAssessments || 0,
          completedAssessments: data.overview?.completedAssessments || 0,
          averageScore: data.overview?.averageScore || 0
        })
      } else {
        setStats({
          totalStudents: 0,
          pendingAssessments: 0,
          completedAssessments: 0,
          averageScore: 0
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setStats({
        totalStudents: 0,
        pendingAssessments: 0,
        completedAssessments: 0,
        averageScore: 0
      })
    } finally {
      setLoading(false)
    }
  }

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
            Overview of your assessment activities and student performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Under your supervision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingAssessments}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your assessment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Assessments</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedAssessments}</div>
              <p className="text-xs text-muted-foreground">
                Total assessments completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Student performance score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Activity</CardTitle>
              <CardDescription>
                Number of assessments completed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  {stats.completedAssessments > 0 ? (
                    <p>Chart coming soon</p>
                  ) : (
                    <p>No analytics data available yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>
                Overall student performance ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  {stats.averageScore > 0 ? (
                    <p>Chart coming soon</p>
                  ) : (
                    <p>No analytics data available yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest assessment activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.completedAssessments > 0 ? (
                <div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium">Completed assessment for John Doe</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium">Scheduled assessment for Jane Smith</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>No recent assessment activity yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
