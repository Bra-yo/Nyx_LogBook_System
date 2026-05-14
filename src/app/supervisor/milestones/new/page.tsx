'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Department {
  id: string
  name: string
  students: {
    id: string
    user: {
      name: string
    }
    regNumber: string
  }[]
}

export default function NewMilestonePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    learnerId: '',
    departmentId: ''
  })

  useEffect(() => {
    fetchDepartments()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/supervisor/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Milestone created successfully')
        router.push(`/supervisor/milestones/${data.milestone.id}`)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create milestone')
      }
    } catch (error) {
      console.error('Failed to create milestone:', error)
      toast.error('Failed to create milestone')
    } finally {
      setLoading(false)
    }
  }

  const selectedDepartment = departments.find(d => d.id === formData.departmentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/supervisor/milestones">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Milestones
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Milestone</h1>
          <p className="text-muted-foreground">Set up a new milestone for learner tracking</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestone Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter milestone title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    departmentId: value,
                    learnerId: '' // Reset learner when department changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the milestone objectives and deliverables"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learnerId">Assigned Learner</Label>
              <Select
                value={formData.learnerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, learnerId: value }))}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.departmentId ? "Select learner (optional)" : "Select department first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific learner</SelectItem>
                  {selectedDepartment?.students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.user.name} ({student.regNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/supervisor/milestones">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Milestone'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}