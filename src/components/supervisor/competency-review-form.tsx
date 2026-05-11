"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Clock, 
  CheckCircle, 
  User,
  Calendar,
  FileText
} from "lucide-react"
import { format } from "date-fns"

interface LogbookEntry {
  id: string
  title: string
  description: string
  activities: string
  challenges?: string
  learnings?: string
  date: string
  status: string
  student: {
    user: {
      name: string
      email: string
    }
  }
  supervisorAssessment?: {
    competencyScore: number
    competencyLabel: string
    competencyDescription: string
    optionalComment?: string
    status: string
  }
}

const competencyLevels = [
  {
    score: 1,
    label: 'Novice',
    description: 'Unable to perform task without continuous guidance.'
  },
  {
    score: 2,
    label: 'Beginner',
    description: 'Performs task with substantial supervision.'
  },
  {
    score: 3,
    label: 'Developing Competence',
    description: 'Performs task with moderate supervision.'
  },
  {
    score: 4,
    label: 'Competent',
    description: 'Performs independently to acceptable workplace standards.'
  },
  {
    score: 5,
    label: 'Proficient/Expert',
    description: 'Performs independently, accurately, efficiently, and can mentor others.'
  }
]

interface CompetencyReviewFormProps {
  selectedEntry: LogbookEntry | null
  onAssessmentSubmit: (entryId: string, score: number, comment: string, status: string) => Promise<void>
  submitting: boolean
}

export function CompetencyReviewForm({ selectedEntry, onAssessmentSubmit, submitting }: CompetencyReviewFormProps) {
  const [selectedScore, setSelectedScore] = useState<number>(selectedEntry?.supervisorAssessment?.competencyScore || 3)
  const [comment, setComment] = useState<string>(selectedEntry?.supervisorAssessment?.optionalComment || "")

  const handleSubmitAssessment = async () => {
    if (!selectedEntry) return
    await onAssessmentSubmit(selectedEntry.id, selectedScore, comment, 'APPROVED')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-600">Pending Review</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-600">Approved</Badge>
      case 'NEEDS_REVISION':
        return <Badge className="bg-orange-600">Needs Revision</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-600">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!selectedEntry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assess Entry</CardTitle>
          <CardDescription>
            Select an entry from the list to review and assess
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Entry Selected</h3>
            <p className="text-muted-foreground">Select an entry from the list to start reviewing</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assess Entry</CardTitle>
        <CardDescription>
          Evaluate {selectedEntry.student.user.name}'s logbook entry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entry Details */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="font-medium mb-3">Entry Details</h3>
          <div className="grid gap-4 text-sm">
            <div>
              <span className="font-medium">Student:</span> {selectedEntry.student.user.name}
            </div>
            <div>
              <span className="font-medium">Date:</span> {format(new Date(selectedEntry.date), 'MMMM dd, yyyy')}
            </div>
            <div>
              <span className="font-medium">Activity:</span> {selectedEntry.title}
            </div>
          </div>
        </div>

        {/* Competency Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Competency Level</Label>
          <div className="grid grid-cols-1 gap-3">
            {competencyLevels.map((level) => (
              <div
                key={level.score}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedScore === level.score
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
                onClick={() => setSelectedScore(level.score)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    selectedScore === level.score ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                  }`}>
                    <span className="font-bold">{level.score}</span>
                  </div>
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Additional Comments (Optional)</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any additional feedback or notes..."
            rows={3}
          />
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label>Review Status</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setComment("")
                setSelectedScore(3)
              }}
              disabled={submitting}
            >
              Request Revision
            </Button>
            
            <Button
              variant={selectedScore >= 3 ? "default" : "outline"}
              onClick={() => handleSubmitAssessment()}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
