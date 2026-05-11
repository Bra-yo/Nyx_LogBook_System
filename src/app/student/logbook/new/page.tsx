"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, Send, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function NewLogbookEntry() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activities: "",
    challenges: "",
    learnings: "",
    date: new Date(),
    attachments: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const [checkingAttendance, setCheckingAttendance] = useState(true)

  useEffect(() => {
    checkAttendanceStatus()
  }, [])

  const checkAttendanceStatus = async () => {
    try {
      setCheckingAttendance(true)
      
      // Check if student has checked in today
      const attendanceResponse = await fetch('/api/attendance/active')
      const attendanceData = await attendanceResponse.json()
      
      if (!attendanceData.hasActiveSession) {
        // Redirect to attendance page with redirect parameter
        router.push('/student/attendance?redirect=/student/logbook/new')
        return
      }
    } catch (error) {
      console.error('Error checking attendance:', error)
    } finally {
      setCheckingAttendance(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date
      }))
    }
  }

  const handleSubmit = async (saveAsDraft: boolean = true) => {
    setIsSubmitting(true)
    setIsDraft(saveAsDraft)

    try {
      // TODO: Implement API call to save logbook entry
      const entryData = {
        ...formData,
        status: saveAsDraft ? "DRAFT" : "PENDING",
        submittedAt: saveAsDraft ? null : new Date()
      }

      console.log("Saving entry:", entryData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to logbook list
      router.push("/student/logbook")
    } catch (error) {
      console.error("Error saving entry:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkingAttendance) {
    return (
      <DashboardLayout title="New Logbook Entry">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="New Logbook Entry">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/student/logbook">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">New Logbook Entry</h2>
              <p className="text-muted-foreground">
                Record your daily or weekly internship activities
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting && isDraft ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting && !isDraft ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Entry Details</CardTitle>
                <CardDescription>
                  Provide information about your internship activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Database Schema Design"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of what you worked on..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activities">Activities *</Label>
                  <Textarea
                    id="activities"
                    placeholder="List the specific activities you performed..."
                    value={formData.activities}
                    onChange={(e) => handleInputChange("activities", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenges">Challenges (Optional)</Label>
                  <Textarea
                    id="challenges"
                    placeholder="Any challenges you faced and how you overcame them..."
                    value={formData.challenges}
                    onChange={(e) => handleInputChange("challenges", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learnings">Learnings (Optional)</Label>
                  <Textarea
                    id="learnings"
                    placeholder="What did you learn from this experience?"
                    value={formData.learnings}
                    onChange={(e) => handleInputChange("learnings", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Upload files related to this entry (coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="text-muted-foreground">
                    <p>File upload functionality</p>
                    <p className="text-sm">Will be implemented in a future update</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Be Specific</p>
                  <p>Include concrete details about your work</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Focus on Learning</p>
                  <p>Highlight what you gained from the experience</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Regular Updates</p>
                  <p>Submit entries frequently for better feedback</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
