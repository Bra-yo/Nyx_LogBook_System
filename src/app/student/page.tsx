"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Clock, TrendingUp, Plus, FileText, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"

interface LogbookEntry {
  id: string
  title: string
  description: string
  date: string
  status: string
}

interface DashboardStats {
  totalEntries: number
  approvedEntries: number
  pendingReviews: number
  draftEntries: number
  progressPercentage: number
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    approvedEntries: 0,
    pendingReviews: 0,
    draftEntries: 0,
    progressPercentage: 0
  })
  const [recentActivity, setRecentActivity] = useState<LogbookEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch logbook entries
      const entriesResponse = await fetch('/api/student/logbook')
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json()
        const entries = entriesData.entries || []
        
        // Calculate stats from real data
        const calculatedStats: DashboardStats = {
          totalEntries: entries.length,
          approvedEntries: entries.filter((e: LogbookEntry) => e.status === 'APPROVED').length,
          pendingReviews: entries.filter((e: LogbookEntry) => e.status === 'PENDING').length,
          draftEntries: entries.filter((e: LogbookEntry) => e.status === 'DRAFT').length,
          progressPercentage: entries.length > 0 ? Math.round((entries.filter((e: LogbookEntry) => e.status === 'APPROVED').length / entries.length) * 100) : 0
        }
        
        setStats(calculatedStats)
        setRecentActivity(entries.slice(0, 3)) // Show only 3 most recent
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalEntries}</div>
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
              <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.approvedEntries}</div>
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
              <div className="text-2xl font-bold text-yellow-600">{loading ? '...' : stats.pendingReviews}</div>
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
              <div className="text-2xl font-bold">{loading ? '...' : `${stats.progressPercentage}%`}</div>
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No logbook entries yet.<br />
                  <Link href="/student/logbook/new" className="text-primary hover:underline">
                    Create your first entry
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((entry) => (
                    <div key={entry.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        entry.status === 'APPROVED' ? 'bg-green-500' :
                        entry.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</div>
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
