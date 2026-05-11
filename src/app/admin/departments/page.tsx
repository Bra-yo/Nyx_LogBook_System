'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Department {
  id: string
  name: string
  code: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function DepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const data = await response.json()
      
      if (data.success) {
        setDepartments(data.departments)
      } else {
        toast.error('Failed to load departments')
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Department created successfully')
        setFormData({ name: '', code: '', description: '' })
        fetchDepartments()
      } else {
        toast.error(result.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Error creating department:', error)
      toast.error('Failed to create department')
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading departments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage academic departments</p>
        </div>
        <Button onClick={() => router.push('/admin/users/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Create Department Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Department</CardTitle>
          <CardDescription>
            Add a new department to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Department Code *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., CS"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Department description (optional)"
                className="w-full p-2 border border-input rounded-md bg-background"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Department'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Departments</CardTitle>
          <CardDescription>
            {departments.length} department{departments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No departments found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first department using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(dept.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
