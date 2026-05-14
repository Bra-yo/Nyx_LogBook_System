'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateMilestonePage() {
  return (
    <DashboardLayout title="Milestones">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/student/milestones">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Milestones
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Create Milestone</h2>
            <p className="text-muted-foreground">Milestone creation for learners</p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Milestones Created by Mentors
            </CardTitle>
            <CardDescription>
              Milestone creation has been moved to your mentor/supervisor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground">
              <p>
                As part of our improved workflow, milestones are now created by your mentor/supervisor.
                This ensures better alignment with your learning objectives and internship requirements.
              </p>
              <p className="mt-2">
                Your mentor will create milestones and assign specific tasks for you to work on.
                When creating logbook entries, you'll select from the available milestones and tasks.
              </p>
            </div>

            <div className="pt-4">
              <Link href="/student/milestones">
                <Button>
                  View Available Milestones
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
