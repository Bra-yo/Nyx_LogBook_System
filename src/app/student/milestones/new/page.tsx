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
            <h2 className="text-2xl font-bold">Milestone creation is disabled</h2>
            <p className="text-muted-foreground">Competency milestones are created by your mentor through your projects.</p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Milestones Are Assigned Through Projects
            </CardTitle>
            <CardDescription>
              Your mentor will assign competency milestones via project management.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground">
              <p>
                Learner milestone creation is no longer available here. Your mentor will create milestones and assign tasks in the project workflow.
              </p>
              <p className="mt-2">
                Use the projects page to view assigned milestones and tasks, or contact your mentor if nothing has been assigned yet.
              </p>
            </div>

            <div className="pt-4">
              <Link href="/student/projects">
                <Button>
                  View My Projects
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
