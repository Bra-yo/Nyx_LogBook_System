'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { terminology } from '@/lib/terminology'
import { Plus, Calendar, User, Building } from 'lucide-react'
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
    user: {
      name: string
    }
  }
  department?: {
    name: string
  }
  tasks: {
    id: string
    title: string
    status: string
  }[]
}

export default function SupervisorMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/supervisor/milestones')
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      }
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading competency milestones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentor {terminology.milestones}</h1>
          <p className="text-muted-foreground">Manage competency milestones and track learner progress</p>
        </div>
        <Button asChild>
          <Link href="/supervisor/milestones/new">
            <Plus className="h-4 w-4 mr-2" />
            Create {terminology.milestone}
          </Link>
        </Button>
      </div>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No competency milestones yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first competency milestone to start tracking learner progress
            </p>
            <Button asChild>
              <Link href="/supervisor/milestones/new">
                <Plus className="h-4 w-4 mr-2" />
                Create {terminology.milestone}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{milestone.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {milestone.description}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(milestone.status)}>
                    {milestone.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(milestone.startDate), 'MMM dd')} - {format(new Date(milestone.endDate), 'MMM dd, yyyy')}
                  </div>
                  {milestone.learner && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {milestone.learner.user.name}
                    </div>
                  )}
                  {milestone.department && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {milestone.department.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{milestone.tasks.length}</span> tasks
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/supervisor/milestones/${milestone.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}