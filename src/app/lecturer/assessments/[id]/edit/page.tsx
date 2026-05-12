"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Save,
  CheckCircle
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
  }>
  assessments?: {
    id: string
    status: string
    technicalScore?: number
    communicationScore?: number
    professionalismScore?: number
    overallScore?: number
    feedback?: string
    assessedAt?: string
  }
}

export default function LecturerAssessmentEditPage() {
  const [entry, setEntry] = useState<LogbookEntry | null>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string

  useEffect(() => {
    fetchEntryAndAssessment()
  }, [entryId])

  const fetchEntryAndAssessment = async () => {
    try {
      const response = await fetch(`/api/lecturer/assessments?entryId=${entryId}`)
      if (response.ok) {
        const data = await response.json()
        const entries = data.entries || []
        const foundEntry = entries.find((e: LogbookEntry) => e.id === entryId)
        setEntry(foundEntry || null)
        
        // Find existing assessment for this entry
        if (foundEntry?.assessments) {
          const existingAssessment = foundEntry.assessments.find((a: any) => a.logbookEntryId === entryId)
          setAssessment(existingAssessment || null)
        }
      }
    } catch (error) {
      console.error('Error fetching entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!entry) return

    setSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const assessmentData = {
        technicalScore: parseInt(formData.get('technicalScore') as string) || undefined,
        communicationScore: parseInt(formData.get('communicationScore') as string) || undefined,
        professionalismScore: parseInt(formData.get('professionalismScore') as string) || undefined,
        overallScore: parseInt(formData.get('overallScore') as string) || undefined,
        feedback: formData.get('feedback') as string || undefined,
        status: assessment?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'
      }

      const url = assessment ? `/api/lecturer/assessments/${assessment.id}` : `/api/lecturer/assessments`
      const method = assessment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logbookEntryId: entryId,
          ...assessmentData
        })
      })

      if (response.ok) {
        router.push('/lecturer/assessments')
      } else {
        console.error('Failed to save assessment')
      }
    } catch (error) {
      console.error('Error saving assessment:', error)
    } finally {
      setSubmitting(false)
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
            <p className="text-muted-foreground">Assessment entry not found.</p>
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
    <DashboardLayout title="Edit Assessment">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Assessment</h1>
            <p className="text-muted-foreground">Evaluate student logbook entry</p>
          </div>
          <Link href="/lecturer/assessments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
        </div>

        {/* Student and Entry Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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

          <Card>
            <CardHeader>
              <CardTitle>Logbook Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Entry Status</p>
                  <Badge className={statusBadgeProps.className}>
                    {statusBadgeProps.label}
                  </Badge>
                </div>
                
                {supervisorStatusBadge && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Supervisor Status</p>
                    <Badge className={supervisorStatusBadge.className}>
                      {supervisorStatusBadge.label}
                    </Badge>
                  </div>
                )}
                
                <div className="mt-2">
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{formatDate(new Date(entry.date))}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Activity Title</p>
                  <p className="text-sm">{entry.title}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm">{entry.description}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Activities</p>
                  <p className="text-sm whitespace-pre-wrap">{entry.activities}</p>
                </div>
                
                {entry.challenges && (
                  <div>
                    <p className="text-sm font-medium">Challenges</p>
                    <p className="text-sm">{entry.challenges}</p>
                  </div>
                )}
                
                {entry.learnings && (
                  <div>
                    <p className="text-sm font-medium">Learnings</p>
                    <p className="text-sm">{entry.learnings}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Lecturer Assessment</CardTitle>
            <CardDescription>Your evaluation of this student's work</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="technicalScore">Technical Score</Label>
                  <Input
                    id="technicalScore"
                    name="technicalScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={assessment?.technicalScore || ''}
                    placeholder="Enter technical score (0-100)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="communicationScore">Communication Score</Label>
                  <Input
                    id="communicationScore"
                    name="communicationScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={assessment?.communicationScore || ''}
                    placeholder="Enter communication score (0-100)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="professionalismScore">Professionalism Score</Label>
                  <Input
                    id="professionalismScore"
                    name="professionalismScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={assessment?.professionalismScore || ''}
                    placeholder="Enter professionalism score (0-100)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="overallScore">Overall Score</Label>
                  <Input
                    id="overallScore"
                    name="overallScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={assessment?.overallScore || ''}
                    placeholder="Enter overall score (0-100)"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback/Comments</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  rows={4}
                  defaultValue={assessment?.feedback || ''}
                  placeholder="Provide detailed feedback on the student's performance..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {assessment ? 'Update Assessment' : 'Save Assessment'}
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/lecturer/assessments')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
