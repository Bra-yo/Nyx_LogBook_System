'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function NewMilestonePage() {
  return (
    <DashboardLayout title="Create Milestone">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Competency milestones must be created inside a project
            </CardTitle>
            <CardDescription>
              Use the project workflow to create and assign competency milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Milestones can no longer be created directly from the standalone milestone page.
              Please create a project and add milestones within that project.
            </p>
            <div className="flex gap-2">
              <Link href="/supervisor/projects">
                <Button>
                  Go to Projects
                </Button>
              </Link>
              <Link href="/supervisor/projects/new">
                <Button variant="outline">
                  Create Project
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
