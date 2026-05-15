'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { terminology } from '@/lib/terminology'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
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

type TaskInput = {
  title: string
  description: string
  expectedOutput: string
  dueDate: string
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
    learnerId: 'unassigned',
    departmentId: 'none'
  })

  const [tasks, setTasks] = useState<TaskInput[]>([
    {
      title: '',
      description: '',
      expectedOutput: '',
      dueDate: '',
    },
  ])

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

  const addTask = () => {
    setTasks(prev => [...prev, {
      title: '',
      description: '',
      expectedOutput: '',
      dueDate: '',
    }])
  }

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateTask = (index: number, field: keyof TaskInput, value: string) => {
    setTasks(prev => prev.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate tasks
      if (tasks.length === 0) {
        toast.error('At least one task is required')
        setLoading(false)
        return
      }

      const invalidTasks = tasks.filter(task => !task.title.trim())
      if (invalidTasks.length > 0) {
        toast.error('All tasks must have a title')
        setLoading(false)
        return
      }

      const submitData = {
        ...formData,
        departmentId: formData.departmentId === 'none' ? '' : formData.departmentId,
        learnerId: formData.learnerId === 'unassigned' || formData.learnerId === 'no-learners' ? '' : formData.learnerId,
        tasks: tasks.map(task => ({
          title: task.title.trim(),
          description: task.description.trim() || null,
          expectedOutput: task.expectedOutput.trim() || null,
          dueDate: task.dueDate || null,
        })),
      }

      const response = await fetch('/api/supervisor/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${terminology.milestone} created successfully`)
        router.push(`/supervisor/milestones/${data.milestone.id}`)
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to create ${terminology.milestone.toLowerCase()}`)
      }
    } catch (error) {
      console.error(`Failed to create ${terminology.milestone.toLowerCase()}:`, error)
      toast.error(`Failed to create ${terminology.milestone.toLowerCase()}`)
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
            Back to {terminology.milestones}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create {terminology.milestone}</h1>
          <p className="text-muted-foreground">Set up a new competency milestone for learner tracking</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{terminology.milestone} Details</CardTitle>
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
                  placeholder={`Enter ${terminology.milestone.toLowerCase()} title`}
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
                    learnerId: 'unassigned' // Reset learner when department changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
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
                placeholder={`Describe the ${terminology.milestone.toLowerCase()} objectives and deliverables`}
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
                disabled={formData.departmentId === 'none' || !formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.departmentId && formData.departmentId !== 'none' ? "Select learner (optional)" : "Select department first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No specific learner</SelectItem>
                  {(selectedDepartment?.students ?? []).length === 0 ? (
                    <SelectItem value="no-learners" disabled>No learners found in this department</SelectItem>
                  ) : (
                    (selectedDepartment?.students ?? []).map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.user?.name ?? "Unnamed Learner"} ({student.regNumber})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Competency Milestone Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{terminology.milestone} Tasks / Deliverables</h3>
                  <p className="text-sm text-muted-foreground">Define the specific tasks the learner needs to complete</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium">Task {index + 1}</h4>
                      {tasks.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTask(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`task-title-${index}`}>Task Title *</Label>
                        <Input
                          id={`task-title-${index}`}
                          value={task.title}
                          onChange={(e) => updateTask(index, 'title', e.target.value)}
                          placeholder="Enter task title"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`task-dueDate-${index}`}>Due Date</Label>
                        <Input
                          id={`task-dueDate-${index}`}
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor={`task-description-${index}`}>Task Description</Label>
                      <Textarea
                        id={`task-description-${index}`}
                        value={task.description}
                        onChange={(e) => updateTask(index, 'description', e.target.value)}
                        placeholder="Describe what the learner needs to accomplish"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor={`task-expectedOutput-${index}`}>Expected Output</Label>
                      <Textarea
                        id={`task-expectedOutput-${index}`}
                        value={task.expectedOutput}
                        onChange={(e) => updateTask(index, 'expectedOutput', e.target.value)}
                        placeholder="What should the learner deliver? (e.g., report, code, presentation)"
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/supervisor/milestones">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? `Creating ${terminology.milestone.toLowerCase()}...` : `Create ${terminology.milestone}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}