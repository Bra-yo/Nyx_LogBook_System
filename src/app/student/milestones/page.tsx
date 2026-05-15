"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { terminology } from "@/lib/terminology"
import { 
  Plus, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Target
} from "lucide-react"
import Link from "next/link"

interface MilestoneData {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: string
  entryCount: number
  mentorAssessment?: {
    status: string
    competencyLevel?: number
  }
  lecturerAssessment?: {
    status: string
    overallScore?: number
  }
  createdAt: string
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "PENDING":
      return "secondary"
    case "SUBMITTED":
      return "outline"
    case "MENTOR_REVIEWED":
      return "default"
    case "LECTURER_REVIEWED":
      return "default"
    case "COMPLETED":
      return "default"
    default:
      return "secondary"
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Draft"
    case "IN_PROGRESS":
      return "In Progress"
    case "SUBMITTED":
      return "Awaiting Mentor Review"
    case "MENTOR_REVIEWED":
      return "Mentor Reviewed"
    case "LECTURER_REVIEWED":
      return "Lecturer Reviewed"
    case "COMPLETED":
      return "Completed"
    default:
      return status
  }
}

export default function LearnerMilestonesPage() {
  const router = useRouter()
  const [milestones, setMilestones] = useState<MilestoneData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/student/milestones")
      
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      } else {
        console.error("Failed to fetch milestones")
      }
    } catch (error) {
      console.error("Error fetching milestones:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <DashboardLayout title={`Learner ${terminology.milestones}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Learner {terminology.milestones}</h2>
            <p className="text-muted-foreground">Competency milestones are assigned through your projects.</p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading competency milestones...</p>
              </div>
            </CardContent>
          </Card>
        ) : milestones.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
              <Target className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No competency milestones have been assigned yet</h3>
                <p className="text-muted-foreground mb-4">Your mentor will assign milestones through your projects.</p>
                <Link href="/student/projects">
                  <Button>
                    View My Projects
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Milestones Grid */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {milestones.map((milestone) => (
              <Card 
                key={milestone.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/student/milestones/${milestone.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{milestone.title}</CardTitle>
                      <CardDescription className="line-clamp-1 mt-1">
                        {milestone.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(milestone.status)}>
                      {getStatusLabel(milestone.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(milestone.startDate)} — {formatDate(milestone.endDate)}</span>
                  </div>

                  {/* Entry Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{milestone.entryCount} logbook {milestone.entryCount === 1 ? "entry" : "entries"}</span>
                  </div>

                  {/* Assessment Status */}
                  {(milestone.mentorAssessment || milestone.lecturerAssessment) && (
                    <div className="space-y-2 pt-2 border-t">
                      {milestone.mentorAssessment && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">Mentor reviewed</span>
                        </div>
                      )}
                      {milestone.lecturerAssessment && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700">Lecturer assessed</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Info */}
                  {milestone.status === "PENDING" && (
                    <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Add entries to submit for review</span>
                    </div>
                  )}
                  {milestone.status === "SUBMITTED" && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Waiting for mentor review</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
