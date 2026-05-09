"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Clock, TrendingUp, Plus, FileText, Calendar } from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
  // Mock data - replace with actual data from API
  const stats = {
    totalEntries: 24,
    approvedEntries: 18,
    pendingReviews: 3,
    draftEntries: 3,
    progressPercentage: 75
  }

  const recentActivity = [
    {
      id: 1,
      title: "Database Design Implementation",
      date: "2024-01-15",
      status: "approved",
      description: "Implemented database schema for user management"
    },
    {
      id: 2,
      title: "API Development",
      date: "2024-01-14",
      status: "pending",
      description: "Created RESTful APIs for logbook entries"
    },
    {
      id: 3,
      title: "Frontend Components",
      date: "2024-01-13",
      status: "draft",
      description: "Built reusable UI components with Tailwind CSS"
    }
  ]

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Welcome back, Student!</h2>
          <Link href="/student/logbook/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">
                All time logbook entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedEntries}</div>
              <p className="text-xs text-muted-foreground">
                Successfully reviewed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting supervisor review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.progressPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                Internship completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest logbook entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.status === 'approved' ? 'bg-green-500' :
                      entry.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/student/logbook/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Entry
                  </Button>
                </Link>
                <Link href="/student/logbook">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    View All Entries
                  </Button>
                </Link>
                <Link href="/student/calendar">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Calendar
                  </Button>
                </Link>
                <Link href="/student/reports">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
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
