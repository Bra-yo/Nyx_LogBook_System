'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building, Users, FileText } from 'lucide-react'
import { terminology } from '@/lib/terminology'

interface ProjectSummary {
  id: string
  title: string
  companyName: string | null
  status: string
  _count: {
    learners: number
    milestones: number
  }
}

export default function SupervisorProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supervisor/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title={terminology.projects}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{terminology.projects}</h1>
            <p className="text-muted-foreground">Manage projects and competency milestones for your learners</p>
          </div>
          <Button asChild>
            <Link href="/supervisor/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Create {terminology.project}
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No projects yet</h2>
              <p className="text-muted-foreground mt-2 mb-4">Create a project to organize competency milestones and assign learners.</p>
              <Button asChild>
                <Link href="/supervisor/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create {terminology.project}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <CardDescription>{project.companyName || 'No company specified'}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="font-medium">{project._count.learners}</div>
                    <div>Assigned learners</div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="font-medium">{project._count.milestones}</div>
                    <div>Competency milestones</div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="font-medium">{project.companyName || '—'}</div>
                    <div>Company</div>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button asChild size="sm">
                      <Link href={`/supervisor/projects/${project.id}`}>View Project</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
