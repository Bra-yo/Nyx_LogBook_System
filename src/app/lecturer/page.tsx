"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  CheckCircle, 
  FileText,
  BarChart3,
  Clock
} from "lucide-react"
import Link from "next/link"

function getLecturerAssessment(entry: any) {
  const assessment =
    Array.isArray(entry.assessments)
      ? entry.assessments[0]
      : entry.assessments ||
        (Array.isArray(entry.lecturerAssessments)
          ? entry.lecturerAssessments[0]
          : entry.lecturerAssessments) ||
        entry.lecturerAssessment ||
        null

  return assessment
}

export default function LecturerDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssessments: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    averageScore: 0
  })

  const [recentEntries, setRecentEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // TEMPORARY: Lecturers can view all students. Restore assignment-based filtering later if required.
      // Fetch data from same sources as students and assessments pages
      const [studentsResponse, assessmentsResponse] = await Promise.all([
        fetch('/api/lecturer/students?limit=100'),
        fetch('/api/lecturer/assessments?limit=100')
      ])

      let totalStudents = 0
      let entries = []

      // Get real student count
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        totalStudents = studentsData.pagination?.total || 0
      }

      // Get assessment data
      if (assessmentsResponse.ok) {
        const assessmentsData = await assessmentsResponse.json()
        entries = assessmentsData.entries || []
      }
      
      // Calculate assessment stats from real data with safe data shape handling
      const assessedEntries = entries.filter((entry: any) => {
        const assessment = getLecturerAssessment(entry)
        return assessment !== null
      })
      const pendingEntries = entries.filter((entry: any) => {
        const assessment = getLecturerAssessment(entry)
        return assessment === null
      })
      
      // Calculate average score from assessed entries
      const overallScores = assessedEntries
        .map((entry: any) => {
          const assessment = getLecturerAssessment(entry)
          return assessment?.overallScore
        })
        .filter((score: number | null) => score !== null && score !== undefined)
      
      const averageScore = overallScores.length > 0 
        ? Math.round(overallScores.reduce((sum: number, score: number) => sum + score, 0) / overallScores.length)
        : 0

      setStats({
        totalStudents,
        totalAssessments: entries.length,
        pendingAssessments: pendingEntries.length,
        completedAssessments: assessedEntries.length,
        averageScore
      })

      // Set recent assessed entries with cleaner data structure and safe access
      const recentAssessed = assessedEntries
        .slice(0, 5)
        .map((entry: any) => {
          const assessment = getLecturerAssessment(entry)
          return {
            id: entry.id,
            studentName: entry.student.user.name,
            entryTitle: entry.title,
            score: assessment?.overallScore || 0,
            assessedAt: assessment?.assessedAt || assessment?.updatedAt,
            feedback: assessment?.feedback || ''
          }
        })
      
      setRecentEntries(recentAssessed)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Lecturer Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, Lecturer!</h2>
            <p className="text-muted-foreground">Assess student performance and provide academic guidance</p>
          </div>
          <Link href="/lecturer/assessments">
            <Button>
              <GraduationCap className="mr-2 h-4 w-4" />
              Assess Now
            </Button>
          </Link>
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
                All visible students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessed This Week</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedAssessments}</div>
              <p className="text-xs text-muted-foreground">
                Student assessments completed
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
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">
                Across all assessments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Latest student performance evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No recent assessments found.</p>
                  </div>
                ) : (
                  recentEntries.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.studentName}</p>
                        <p className="text-xs text-muted-foreground">{entry.entryTitle}</p>
                        {entry.feedback && (
                          <p className="text-xs text-muted-foreground italic mt-1">"{entry.feedback.substring(0, 50)}{entry.feedback.length > 50 ? '...' : ''}"</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Overall Score: {entry.score}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {entry.assessedAt ? new Date(entry.assessedAt).toLocaleDateString() : 'No date'}
                        </div>
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
              <CardDescription>Common lecturer tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/lecturer/students">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    View All Students
                  </Button>
                </Link>
                <Link href="/lecturer/assessments">
                  <Button variant="outline" className="w-full justify-start">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Pending Assessments
                  </Button>
                </Link>
                <Link href="/lecturer/reports">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Reports
                  </Button>
                </Link>
                <Link href="/lecturer/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
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
