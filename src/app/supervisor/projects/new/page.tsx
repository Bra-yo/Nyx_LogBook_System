'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { terminology } from '@/lib/terminology'
import { ArrowLeft, Save } from 'lucide-react'

interface Learner {
  id: string
  user: {
    name: string
  }
  regNumber: string
  department?: {
    id: string
    name: string
  }
}

interface Department {
  id: string
  name: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [learners, setLearners] = useState<Learner[]>([])
  const [selectedLearners, setSelectedLearners] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    departmentId: 'no-department',
    status: 'ACTIVE'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchLearners()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchLearners = async () => {
    try {
      const response = await fetch('/api/supervisor/students?limit=100')
      if (response.ok) {
        const data = await response.json()
        setLearners(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch learners:', error)
    }
  }

  const toggleLearner = (learnerId: string) => {
    setSelectedLearners((prev) =>
      prev.includes(learnerId) ? prev.filter((id) => id !== learnerId) : [...prev, learnerId]
    )
  }

  const filteredLearners = formData.departmentId === 'no-department'
    ? learners
    : learners.filter((learner) => learner.department?.id === formData.departmentId)


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        companyName: formData.companyName.trim() || null,
        departmentId: formData.departmentId === 'no-department' ? null : formData.departmentId,
        learnerIds: selectedLearners,
        status: formData.status
      }

      const response = await fetch('/api/supervisor/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/supervisor/projects/${data.project.id}`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title={`Create ${terminology.project}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/supervisor/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {terminology.projects}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create {terminology.project}</h1>
            <p className="text-muted-foreground">Create a new project and assign learners for competency milestones</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{terminology.project} Details</CardTitle>
            <CardDescription>Fill in the project information and assign learners.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                    id="title"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe the project goals and expectations"
                  rows={4}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, companyName: event.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department (optional)</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, departmentId: value }))
                      setSelectedLearners([])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-department">No department</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.departmentId !== 'no-department' && (
                    <p className="text-sm text-muted-foreground">Showing learners from the selected department only.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Assign Learners</h3>
                    <p className="text-sm text-muted-foreground">Select learners for this project.</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedLearners.length} selected</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLearners.map((learner) => (
                    <label key={learner.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLearners.includes(learner.id)}
                        onChange={() => toggleLearner(learner.id)}
                        className="h-4 w-4 rounded border-muted-foreground"
                      />
                      <span>{learner.user.name} ({learner.regNumber})</span>
                    </label>
                  ))}
                  {filteredLearners.length === 0 && (
                    <div className="text-sm text-muted-foreground">No learners available yet for your selection.</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                  <Link href="/supervisor/projects">Cancel</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
