'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Calendar, User, Building, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Milestone {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: string
  learner?: {
    id: string
    user: {
      name: string
    }
  }
  department?: {
    name: string
  }
  mentor: {
    user: {
      name: string
    }
  }
  tasks: {
    id: string
    title: string
    description: string | null
    expectedOutput: string | null
    dueDate: string | null
    status: string
    entries: {
      id: string
      title: string
      description: string
      date: string
      status: string
      student: {
        user: {
          name: string
        }
      }
    }[]
    weeklyReviews: {
      id: string
      weekStartDate: string
      weekEndDate: string
      competencyLevel: number
      comment: string | null
      status: string
      createdAt: string
    }[]
  }[]
}

export default function MilestoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [milestone, setMilestone] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMilestone()
    }
  }, [params.id])

  const fetchMilestone = async () => {
    try {
      const response = await fetch(`/api/supervisor/milestones/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMilestone(data.milestone)
      } else if (response.status === 404) {
        router.push('/supervisor/milestones')
      }
    } catch (error) {
      console.error('Failed to fetch milestone:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'VERIFIED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading milestone...</p>
        </div>
      </div>
    )
  }

  if (!milestone) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Milestone not found</h2>
        <p className="text-muted-foreground mb-4">The milestone you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/supervisor/milestones">Back to Milestones</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/supervisor/milestones">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Milestones
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{milestone.title}</h1>
          <p className="text-muted-foreground">{milestone.description}</p>
        </div>
        <Badge className={getStatusColor(milestone.status)}>
          {milestone.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Timeline</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {format(new Date(milestone.startDate), 'MMM dd')} - {format(new Date(milestone.endDate), 'MMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tasks</span>
            </div>
            <p className="text-2xl font-bold mt-2">{milestone.tasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Assigned To</span>
            </div>
            <p className="text-lg font-semibold mt-2">
              {milestone.learner ? milestone.learner.user.name :
               milestone.department ? milestone.department.name : 'Unassigned'}
            </p>
          </CardContent>
        </Card>
      </div>



      {/* Milestone Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone Overview</CardTitle>
          <CardDescription>
            Created by {milestone.mentor.user.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">{milestone.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Assignment</h4>
                {milestone.learner && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{milestone.learner.user.name}</span>
                  </div>
                )}
                {milestone.department && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{milestone.department.name}</span>
                  </div>
                )}
                {!milestone.learner && !milestone.department && (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Progress</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Tasks Completed</span>
                    <span>{milestone.tasks.filter(t => t.status === 'COMPLETED').length} / {milestone.tasks.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: milestone.tasks.length > 0
                          ? `${(milestone.tasks.filter(t => t.status === 'COMPLETED').length / milestone.tasks.length) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Breakdown of work items for this milestone</CardDescription>
            </div>
            <Button asChild>
              <Link href={`/supervisor/milestones/${milestone.id}/tasks/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {milestone.tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-4">
                Add tasks to break down this milestone into manageable deliverables
              </p>
              <Button asChild>
                <Link href={`/supervisor/milestones/${milestone.id}/tasks/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {milestone.tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{task.title}</h4>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  {task.expectedOutput && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Expected Output: </span>
                      <span className="text-sm text-muted-foreground">{task.expectedOutput}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Due: </span>
                      <span className="text-sm text-muted-foreground">{format(new Date(task.dueDate), 'PPP')}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">{task.entries.length}</span> logbook entries
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