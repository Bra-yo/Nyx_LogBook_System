"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TimeGreeting } from "@/components/common/time-greeting"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Folder,
  Plus,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { getLogbookDisplayStatus } from "@/lib/logbook-status"
import { LogStatus } from "@/types"

export default function SupervisorDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    approvedToday: 0,
    weeklySubmissions: 0
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // TEMPORARY: Supervisors can view all students. Restore assignment-based filtering later if required.
      const [studentsResponse, reviewsResponse] = await Promise.all([
        fetch('/api/supervisor/students?limit=100'), // Get all students
        fetch('/api/supervisor/review?limit=10') // Get recent entries
      ])

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStats(prev => ({
          ...prev,
          totalStudents: studentsData.students?.length || 0
        }))
      }

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        const entries = reviewsData.entries || []
        
        // Calculate display status for all entries
        const entriesWithDisplayStatus = entries.map((entry: any) => ({
          ...entry,
          displayStatus: getLogbookDisplayStatus(entry)
        }))
        
        // Count pending reviews using display status
        const pendingCount = entriesWithDisplayStatus.filter((entry: any) => entry.displayStatus === LogStatus.PENDING).length
        
        // Count approved today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const approvedTodayCount = entriesWithDisplayStatus.filter((entry: any) => 
          entry.displayStatus === LogStatus.APPROVED && 
          new Date(entry.updatedAt) >= today
        ).length

        // Count weekly submissions
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyCount = entries.filter((entry: any) => 
          new Date(entry.createdAt) >= weekAgo
        ).length

        setStats(prev => ({
          ...prev,
          pendingReviews: pendingCount,
          approvedToday: approvedTodayCount,
          weeklySubmissions: weeklyCount
        }))

        // Set recent activity using display status
        setRecentActivity(entriesWithDisplayStatus.slice(0, 5).map((entry: any) => ({
          id: entry.id,
          studentName: entry.student.user.name,
          entryTitle: entry.title,
          status: entry.displayStatus.toLowerCase(),
          submittedAt: new Date(entry.createdAt).toLocaleDateString()
        })))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    )
  }

  return (
    <DashboardLayout title="Mentor Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <TimeGreeting userName={session?.user?.name} />
            <p className="text-muted-foreground">Review and manage learner logbook entries</p>
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
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
              <p className="text-xs text-muted-foreground">
                Entries reviewed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Submissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklySubmissions}</div>
              <p className="text-xs text-muted-foreground">
                This week's total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest learner logbook entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No recent activity found.</p>
                  </div>
                ) : (
                  recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'approved' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.studentName}</p>
                        <p className="text-xs text-muted-foreground">{activity.entryTitle}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.submittedAt}</div>
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
  )
}
