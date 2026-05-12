"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  User, 
  Calendar,
  FileText,
  Edit,
  CheckCircle,
  Clock
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { getLogbookDisplayStatus, getSupervisorStatusBadgeProps, getStatusBadgeProps } from "@/lib/logbook-status"
import { LogStatus } from "@/types"

interface LogbookEntry {
  id: string
  title: string
  description: string
  activities: string
  challenges?: string
  learnings?: string
  date: string
  status: LogStatus
  student: {
    user: {
      name: string
      email: string
    }
    regNumber: string
    department?: {
      name: string
    }
  }
  comments?: Array<{
    status: string
    createdAt: string
    optionalComment?: string
  }>
  assessments?: {
    status: string
    assessedAt?: string
  }
}

export default function LecturerAssessmentDetailPage() {
  const [entry, setEntry] = useState<LogbookEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchEntry()
  }, [])

  const fetchEntry = async () => {
    try {
      const urlParts = window.location.pathname.split('/')
      const entryId = urlParts[urlParts.length - 1]
      
      const response = await fetch(`/api/lecturer/assessments`)
      if (response.ok) {
        const data = await response.json()
        const entries = data.entries || []
        const foundEntry = entries.find((e: any) => e.id === entryId)
        setEntry(foundEntry || null)
      }
    } catch (error) {
      console.error('Error fetching entry:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!entry) {
    return (
      <DashboardLayout title="Assessment Entry">
        <div className="space-y-6">
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Entry Not Found</h2>
            <p className="text-muted-foreground">The requested assessment entry could not be found.</p>
            <Link href="/lecturer/assessments">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessments
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const displayStatus = getLogbookDisplayStatus(entry)
  const statusBadgeProps = getStatusBadgeProps(displayStatus)
  const supervisorStatusBadge = entry.comments?.[0] ? getSupervisorStatusBadgeProps(entry.comments[0].status) : null

  return (
    <DashboardLayout title="Assessment Entry">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assessment Entry</h1>
            <p className="text-muted-foreground">Review and evaluate student logbook entry</p>
          </div>
          <Link href="/lecturer/assessments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
        </div>

        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm">{entry.student.user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm">{entry.student.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Registration Number</p>
                <p className="text-sm">{entry.student.regNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm">{entry.student.department?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Details */}
        <Card>
          <CardHeader>
            <CardTitle>Logbook Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{formatDate(new Date(entry.date))}</span>
              </div>
              
              <div>
                <p className="font-medium mb-2">Activity Title</p>
                <p className="text-sm">{entry.title}</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Description</p>
                <p className="text-sm">{entry.description}</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Activities</p>
                <p className="text-sm whitespace-pre-wrap">{entry.activities}</p>
              </div>
              
              {entry.challenges && (
                <div>
                  <p className="font-medium mb-2">Challenges</p>
                  <p className="text-sm">{entry.challenges}</p>
                </div>
              )}
              
              {entry.learnings && (
                <div>
                  <p className="font-medium mb-2">Learnings</p>
                  <p className="text-sm">{entry.learnings}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Supervisor Status</CardTitle>
              <CardDescription>Status from supervisor review</CardDescription>
            </CardHeader>
            <CardContent>
              {supervisorStatusBadge ? (
                <Badge className={supervisorStatusBadge.className}>
                  {supervisorStatusBadge.label}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No supervisor review yet</p>
              )}
              {entry.comments?.[0]?.optionalComment && (
                <p className="text-sm mt-2 italic">"{entry.comments[0].optionalComment}"</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lecturer Assessment</CardTitle>
              <CardDescription>Your evaluation of this entry</CardDescription>
            </CardHeader>
            <CardContent>
              {entry.assessments ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge className={
                      entry.assessments.status === 'COMPLETED' ? 'bg-green-600' : 'bg-yellow-600'
                    }>
                      {entry.assessments.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p><strong>Assessed:</strong> {formatDate(new Date(entry.assessments.assessedAt!))}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No assessment completed yet</p>
                  <Link href={`/lecturer/assessments/${entry.id}/edit`}>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      Start Assessment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
