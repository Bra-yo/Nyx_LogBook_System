'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { terminology } from '@/lib/terminology'

interface LearnerOption {
  id: string
  learner: { id: string; user: { name: string }; regNumber: string }
}

interface ProjectInfo {
  id: string
  title: string
  learners: LearnerOption[]
}

export default function NewProjectMilestonePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params as { id: string }).id
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    learnerId: 'all-project-learners',
    tasksText: ''
  })

  useEffect(() => {
    if (projectId) fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/supervisor/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project || null)
      } else {
        router.push('/supervisor/projects')
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      router.push('/supervisor/projects')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        learnerId: formData.learnerId === 'all-project-learners' ? null : formData.learnerId,
        tasksText: formData.tasksText.trim()
      }

      const response = await fetch(`/api/supervisor/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push(`/supervisor/projects/${projectId}`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create competency milestone')
      }
    } catch (error) {
      console.error('Failed to create competency milestone:', error)
      alert('Failed to create competency milestone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title={`Create ${terminology.milestone}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/supervisor/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create {terminology.milestone}</h1>
            <p className="text-muted-foreground">Create a competency milestone inside this project.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{project?.title || terminology.project}</CardTitle>
            <CardDescription>{project ? `Project: ${project.title}` : 'Loading project details...'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder={`Enter ${terminology.milestone.toLowerCase()} title`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learnerId">Applies To</Label>
                  <Select
                    value={formData.learnerId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, learnerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose who this applies to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-project-learners">Applies to all project learners</SelectItem>
                      {project?.learners.map((item) => (
                        <SelectItem key={item.learner.id} value={item.learner.id}>
                          {item.learner.user.name} ({item.learner.regNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Choose one learner or apply this competency milestone to all learners assigned to the project.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={`Describe the ${terminology.milestone.toLowerCase()} objectives`}
                  rows={3}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tasksText">Tasks / Deliverables *</Label>
                    <p className="text-sm text-muted-foreground">Paste the tasks or deliverables for this competency milestone here.</p>
                  </div>
                </div>
                <Textarea
                  id="tasksText"
                  value={formData.tasksText}
                  onChange={(event) => setFormData((prev) => ({ ...prev, tasksText: event.target.value }))}
                  placeholder={
                    'Paste the tasks or deliverables for this competency milestone here.\nYou can paste each task on a new line or paste a paragraph.\n\nExample text:\nDesign homepage layout\nBuild authentication screens\nConnect dashboard to database\nTest role-based access'
                  }
                  rows={8}
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                  <Link href={`/supervisor/projects/${projectId}`}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : `Create ${terminology.milestone}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
