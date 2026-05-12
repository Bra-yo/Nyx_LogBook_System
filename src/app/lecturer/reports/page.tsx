"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  TrendingUp
} from "lucide-react"
import { format } from "date-fns"

interface Report {
  id: string
  title: string
  type: string
  generatedAt: string
  studentCount?: number
  status: string
}

export default function LecturerReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/lecturer/analytics')
      if (response.ok) {
        const data = await response.json()
        // If there are completed assessments, show a simple message
        if (data.overview?.completedAssessments > 0) {
          setReports([{
            id: "1",
            title: "Assessment Reports Available",
            type: "assessment",
            generatedAt: new Date().toISOString(),
            studentCount: data.overview?.totalStudents || 0,
            status: "completed"
          }])
        } else {
          setReports([])
        }
      } else {
        setReports([])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (type: string) => {
    try {
      console.log(`Report generation will be available after assessments are recorded.`)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Reports">
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Reports</h2>
            <p className="text-muted-foreground">
              Generate and view student performance and activity reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => generateReport('performance')} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Performance Report
            </Button>
            <Button onClick={() => generateReport('attendance')} variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Attendance Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                Generated this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Under your supervision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">85%</div>
              <p className="text-xs text-muted-foreground">
                Student competency score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports available</h3>
              <p className="text-muted-foreground">
                Generate your first report to get started with student analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Previously generated reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.type === 'performance' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.type} • {report.studentCount} students</p>
                        <p className="text-xs text-muted-foreground">Generated {format(new Date(report.generatedAt), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={report.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}>
                        {report.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
