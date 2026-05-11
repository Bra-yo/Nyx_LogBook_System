"use client"

import { useState } from "react"
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

export default function LecturerDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    assessedThisWeek: 0,
    pendingAssessments: 0,
    averageScore: 0
  })

  const [recentAssessments, setRecentAssessments] = useState([])

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
                Under your supervision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessed This Week</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.assessedThisWeek}</div>
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
              <div className="space-y-4">
                {recentAssessments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No recent assessments found.</p>
                  </div>
                ) : (
                  recentAssessments.map((assessment: any) => (
                    <div key={assessment.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{assessment.studentName}</p>
                        <p className="text-xs text-muted-foreground">{assessment.entryTitle}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{assessment.score}%</div>
                        <div className="text-xs text-muted-foreground">{assessment.assessedAt}</div>
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
