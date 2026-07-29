'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { AlertCircle, BookOpen, BrainCircuit, Edit, ListChecks, Loader2, Trash2, Users } from 'lucide-react'

type LearningAreaStatus = 'ACTIVE' | 'INACTIVE'
type CompetencyDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

interface LearningArea {
  id: string
  name: string
  code: string
  description?: string | null
  status: LearningAreaStatus
  sortOrder?: number | null
  createdAt: string
  updatedAt: string
  _count?: { competencies: number }
}

interface Competency {
  id: string
  code: string
  name: string
  description?: string | null
  status: LearningAreaStatus
  difficulty?: CompetencyDifficulty | null
  estimatedDurationWeeks?: number | null
  sortOrder?: number | null
  learningAreaId: string
  learningArea?: { id: string; name: string; code: string }
  createdAt: string
  updatedAt: string
}

interface CompetencyGroup {
  id: string
  code: string
  name: string
  description?: string | null
  status: LearningAreaStatus
  competencyId: string
  competency?: { id: string; name: string; code: string; learningArea?: { id: string; name: string; code: string } | null }
  createdAt: string
  updatedAt: string
}

interface SupervisorOption {
  id: string
  name: string
  email: string
}

interface MentorCompetencyGroup {
  id: string
  status: LearningAreaStatus
  notes?: string | null
  mentor: { id: string; user: { id: string; name: string; email: string } }
  competencyGroup: { id: string; name: string; code: string; competency: { id: string; name: string; code: string } }
}

interface LearningAreaFormState {
  name: string
  description: string
  status: LearningAreaStatus
  sortOrder: number
}

interface CompetencyFormState {
  learningAreaId: string
  name: string
  description: string
  status: LearningAreaStatus
  difficulty: CompetencyDifficulty | ''
  sortOrder: number
}

interface CompetencyGroupFormState {
  competencyId: string
  name: string
  description: string
  status: LearningAreaStatus
}

interface MentorCompetencyGroupFormState {
  mentorId: string
  competencyGroupId: string
  status: LearningAreaStatus
  notes: string
}

const getInitialLearningAreaForm = (): LearningAreaFormState => ({
  name: '',
  description: '',
  status: 'ACTIVE',
  sortOrder: 0,
})

const getInitialCompetencyForm = (): CompetencyFormState => ({
  learningAreaId: '',
  name: '',
  description: '',
  status: 'ACTIVE',
  difficulty: '',
  sortOrder: 0,
})

const getInitialCompetencyGroupForm = (): CompetencyGroupFormState => ({
  competencyId: '',
  name: '',
  description: '',
  status: 'ACTIVE',
})

const getInitialMentorCompetencyGroupForm = (): MentorCompetencyGroupFormState => ({
  mentorId: '',
  competencyGroupId: '',
  status: 'ACTIVE',
  notes: '',
})

export default function LearningArchitecturePage() {
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [competencyGroups, setCompetencyGroups] = useState<CompetencyGroup[]>([])
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([])
  const [mentorCompetencyGroups, setMentorCompetencyGroups] = useState<MentorCompetencyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSavingLearningArea, setIsSavingLearningArea] = useState(false)
  const [isSavingCompetency, setIsSavingCompetency] = useState(false)
  const [isSavingCompetencyGroup, setIsSavingCompetencyGroup] = useState(false)
  const [isSavingMentorCompetencyGroup, setIsSavingMentorCompetencyGroup] = useState(false)
  const [learningAreaError, setLearningAreaError] = useState<string | null>(null)
  const [competencyError, setCompetencyError] = useState<string | null>(null)
  const [competencyGroupError, setCompetencyGroupError] = useState<string | null>(null)
  const [mentorCompetencyGroupError, setMentorCompetencyGroupError] = useState<string | null>(null)
  const [learningAreaForm, setLearningAreaForm] = useState<LearningAreaFormState>(getInitialLearningAreaForm)
  const [competencyForm, setCompetencyForm] = useState<CompetencyFormState>(getInitialCompetencyForm)
  const [competencyGroupForm, setCompetencyGroupForm] = useState<CompetencyGroupFormState>(getInitialCompetencyGroupForm)
  const [mentorCompetencyGroupForm, setMentorCompetencyGroupForm] = useState<MentorCompetencyGroupFormState>(getInitialMentorCompetencyGroupForm)
  const [editingLearningAreaId, setEditingLearningAreaId] = useState<string | null>(null)
  const [editingCompetencyId, setEditingCompetencyId] = useState<string | null>(null)
  const [editingCompetencyGroupId, setEditingCompetencyGroupId] = useState<string | null>(null)
  const [editingMentorCompetencyGroupId, setEditingMentorCompetencyGroupId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoadError(null)
      const [areasResponse, competenciesResponse, competencyGroupsResponse, supervisorsResponse, mentorCompetencyGroupsResponse] = await Promise.all([
        fetch('/api/admin/learning-areas'),
        fetch('/api/admin/competencies'),
        fetch('/api/admin/competency-groups'),
        fetch('/api/admin/users?role=SUPERVISOR'),
        fetch('/api/admin/mentor-competency-groups'),
      ])
      const areasData = await areasResponse.json()
      const competenciesData = await competenciesResponse.json()
      const competencyGroupsData = await competencyGroupsResponse.json()
      const supervisorsData = await supervisorsResponse.json()
      const mentorCompetencyGroupsData = await mentorCompetencyGroupsResponse.json()

      if (!areasResponse.ok || !areasData.success) {
        throw new Error(areasData.error || 'Failed to load learning areas')
      }

      if (!competenciesResponse.ok || !competenciesData.success) {
        throw new Error(competenciesData.error || 'Failed to load competencies')
      }

      if (!competencyGroupsResponse.ok || !competencyGroupsData.success) {
        throw new Error(competencyGroupsData.error || 'Failed to load competency groups')
      }

      if (!supervisorsResponse.ok || !Array.isArray(supervisorsData.users)) {
        throw new Error(supervisorsData.error || 'Failed to load supervisors')
      }

      if (!mentorCompetencyGroupsResponse.ok || !mentorCompetencyGroupsData.success) {
        throw new Error(mentorCompetencyGroupsData.error || 'Failed to load mentor expertise')
      }

      setLearningAreas(areasData.learningAreas ?? [])
      setCompetencies(competenciesData.competencies ?? [])
      setCompetencyGroups(competencyGroupsData.competencyGroups ?? [])
      setSupervisors(
        supervisorsData.users
          .filter((user: { supervisorProfile?: { id?: string } }) => user.supervisorProfile?.id)
          .map((user: { supervisorProfile?: { id?: string }; name?: string; email?: string }) => ({
            id: user.supervisorProfile?.id ?? '',
            name: user.name ?? 'Unnamed mentor',
            email: user.email ?? '',
          })),
      )
      setMentorCompetencyGroups(mentorCompetencyGroupsData.mentorCompetencyGroups ?? [])
    } catch (error) {
      console.error(error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load learning architecture data')
      toast.error('Failed to load learning architecture data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void fetchData() }, [])

  const resetLearningAreaForm = () => {
    setLearningAreaForm(getInitialLearningAreaForm())
    setEditingLearningAreaId(null)
    setLearningAreaError(null)
  }

  const resetCompetencyForm = () => {
    setCompetencyForm(getInitialCompetencyForm())
    setEditingCompetencyId(null)
    setCompetencyError(null)
  }

  const resetCompetencyGroupForm = () => {
    setCompetencyGroupForm(getInitialCompetencyGroupForm())
    setEditingCompetencyGroupId(null)
    setCompetencyGroupError(null)
  }

  const resetMentorCompetencyGroupForm = () => {
    setMentorCompetencyGroupForm(getInitialMentorCompetencyGroupForm())
    setEditingMentorCompetencyGroupId(null)
    setMentorCompetencyGroupError(null)
  }

  const handleLearningAreaSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = learningAreaForm.name.trim()
    const sortOrder = Number(learningAreaForm.sortOrder)

    if (!trimmedName) {
      setLearningAreaError('Learning area name is required.')
      return
    }

    if (Number.isNaN(sortOrder) || sortOrder < 0) {
      setLearningAreaError('Sort order must be 0 or higher.')
      return
    }

    setLearningAreaError(null)
    setIsSavingLearningArea(true)
    try {
      const url = editingLearningAreaId ? `/api/admin/learning-areas/${editingLearningAreaId}` : '/api/admin/learning-areas'
      const method = editingLearningAreaId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: learningAreaForm.description.trim(),
          status: learningAreaForm.status,
          sortOrder,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success(editingLearningAreaId ? 'Learning area updated' : 'Learning area created')
        resetLearningAreaForm()
        await fetchData()
      } else {
        setLearningAreaError(result.error || 'Unable to save learning area')
        toast.error(result.error || 'Unable to save learning area')
      }
    } catch (error) {
      console.error(error)
      setLearningAreaError('Unable to save learning area')
      toast.error('Unable to save learning area')
    } finally {
      setIsSavingLearningArea(false)
    }
  }

  const handleCompetencySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = competencyForm.name.trim()
    const sortOrder = Number(competencyForm.sortOrder)

    if (!competencyForm.learningAreaId) {
      setCompetencyError('Please select a learning area before saving.')
      return
    }

    if (!trimmedName) {
      setCompetencyError('Competency name is required.')
      return
    }

    if (Number.isNaN(sortOrder) || sortOrder < 0) {
      setCompetencyError('Sort order must be 0 or higher.')
      return
    }

    setCompetencyError(null)
    setIsSavingCompetency(true)
    try {
      const url = editingCompetencyId ? `/api/admin/competencies/${editingCompetencyId}` : '/api/admin/competencies'
      const method = editingCompetencyId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learningAreaId: competencyForm.learningAreaId,
          name: trimmedName,
          description: competencyForm.description.trim(),
          status: competencyForm.status,
          difficulty: competencyForm.difficulty || null,
          estimatedDurationWeeks: null,
          sortOrder,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success(editingCompetencyId ? 'Competency updated' : 'Competency created')
        resetCompetencyForm()
        await fetchData()
      } else {
        setCompetencyError(result.error || 'Unable to save competency')
        toast.error(result.error || 'Unable to save competency')
      }
    } catch (error) {
      console.error(error)
      setCompetencyError('Unable to save competency')
      toast.error('Unable to save competency')
    } finally {
      setIsSavingCompetency(false)
    }
  }

  const handleCompetencyGroupSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = competencyGroupForm.name.trim()

    if (!competencyGroupForm.competencyId) {
      setCompetencyGroupError('Please select a competency before saving.')
      return
    }

    if (!trimmedName) {
      setCompetencyGroupError('Competency group name is required.')
      return
    }

    setCompetencyGroupError(null)
    setIsSavingCompetencyGroup(true)
    try {
      const url = editingCompetencyGroupId ? `/api/admin/competency-groups/${editingCompetencyGroupId}` : '/api/admin/competency-groups'
      const method = editingCompetencyGroupId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competencyId: competencyGroupForm.competencyId,
          name: trimmedName,
          description: competencyGroupForm.description.trim(),
          status: competencyGroupForm.status,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success(editingCompetencyGroupId ? 'Competency group updated' : 'Competency group created')
        resetCompetencyGroupForm()
        await fetchData()
      } else {
        setCompetencyGroupError(result.error || 'Unable to save competency group')
        toast.error(result.error || 'Unable to save competency group')
      }
    } catch (error) {
      console.error(error)
      setCompetencyGroupError('Unable to save competency group')
      toast.error('Unable to save competency group')
    } finally {
      setIsSavingCompetencyGroup(false)
    }
  }

  const handleMentorCompetencyGroupSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedNotes = mentorCompetencyGroupForm.notes.trim()

    if (!mentorCompetencyGroupForm.mentorId) {
      setMentorCompetencyGroupError('Please select a mentor before saving.')
      return
    }

    if (!mentorCompetencyGroupForm.competencyGroupId) {
      setMentorCompetencyGroupError('Please select a competency group before saving.')
      return
    }

    setMentorCompetencyGroupError(null)
    setIsSavingMentorCompetencyGroup(true)
    try {
      const url = editingMentorCompetencyGroupId ? `/api/admin/mentor-competency-groups/${editingMentorCompetencyGroupId}` : '/api/admin/mentor-competency-groups'
      const method = editingMentorCompetencyGroupId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: mentorCompetencyGroupForm.mentorId,
          competencyGroupId: mentorCompetencyGroupForm.competencyGroupId,
          status: mentorCompetencyGroupForm.status,
          notes: trimmedNotes || null,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success(editingMentorCompetencyGroupId ? 'Mentor expertise updated' : 'Mentor expertise created')
        resetMentorCompetencyGroupForm()
        await fetchData()
      } else {
        setMentorCompetencyGroupError(result.error || 'Unable to save mentor expertise')
        toast.error(result.error || 'Unable to save mentor expertise')
      }
    } catch (error) {
      console.error(error)
      setMentorCompetencyGroupError('Unable to save mentor expertise')
      toast.error('Unable to save mentor expertise')
    } finally {
      setIsSavingMentorCompetencyGroup(false)
    }
  }

  const deleteLearningArea = async (id: string) => {
    if (!confirm('Delete this learning area and its competencies?')) return
    try {
      const response = await fetch(`/api/admin/learning-areas/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Learning area deleted')
        await fetchData()
      } else {
        toast.error(result.error || 'Unable to delete learning area')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete learning area')
    }
  }

  const deleteCompetency = async (id: string) => {
    if (!confirm('Delete this competency?')) return
    try {
      const response = await fetch(`/api/admin/competencies/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Competency deleted')
        await fetchData()
      } else {
        toast.error(result.error || 'Unable to delete competency')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete competency')
    }
  }

  const deleteCompetencyGroup = async (id: string) => {
    if (!confirm('Delete this competency group?')) return
    try {
      const response = await fetch(`/api/admin/competency-groups/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Competency group deleted')
        await fetchData()
      } else {
        toast.error(result.error || 'Unable to delete competency group')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete competency group')
    }
  }

  const deleteMentorCompetencyGroup = async (id: string) => {
    if (!confirm('Remove this mentor expertise?')) return
    try {
      const response = await fetch(`/api/admin/mentor-competency-groups/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Mentor expertise removed')
        await fetchData()
      } else {
        toast.error(result.error || 'Unable to remove mentor expertise')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to remove mentor expertise')
    }
  }

  const startEditLearningArea = (learningArea: LearningArea) => {
    setEditingLearningAreaId(learningArea.id)
    setLearningAreaForm({
      name: learningArea.name,
      description: learningArea.description || '',
      status: learningArea.status,
      sortOrder: learningArea.sortOrder ?? 0,
    })
    setLearningAreaError(null)
  }

  const startEditCompetency = (competency: Competency) => {
    setEditingCompetencyId(competency.id)
    setCompetencyForm({
      learningAreaId: competency.learningAreaId,
      name: competency.name,
      description: competency.description || '',
      status: competency.status,
      difficulty: competency.difficulty ?? '',
      sortOrder: competency.sortOrder ?? 0,
    })
    setCompetencyError(null)
  }

  const startEditCompetencyGroup = (competencyGroup: CompetencyGroup) => {
    setEditingCompetencyGroupId(competencyGroup.id)
    setCompetencyGroupForm({
      competencyId: competencyGroup.competencyId,
      name: competencyGroup.name,
      description: competencyGroup.description || '',
      status: competencyGroup.status,
    })
    setCompetencyGroupError(null)
  }

  const startEditMentorCompetencyGroup = (mentorCompetencyGroup: MentorCompetencyGroup) => {
    setEditingMentorCompetencyGroupId(mentorCompetencyGroup.id)
    setMentorCompetencyGroupForm({
      mentorId: mentorCompetencyGroup.mentor.id,
      competencyGroupId: mentorCompetencyGroup.competencyGroup.id,
      status: mentorCompetencyGroup.status,
      notes: mentorCompetencyGroup.notes || '',
    })
    setMentorCompetencyGroupError(null)
  }

  if (isLoading) {
    return <div className='container mx-auto py-6 text-muted-foreground'>Loading learning architecture…</div>
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Learning Architecture</h1>
          <p className='text-muted-foreground'>Manage learning areas and competencies with automatic coding.</p>
        </div>
      </div>

      {loadError ? (
        <div className='flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
          <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
          <span>{loadError}</span>
        </div>
      ) : null}

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><BookOpen className='h-4 w-4' />Learning Areas</CardTitle>
            <CardDescription>Create and maintain academic learning areas.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleLearningAreaSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='learning-area-name'>Name</Label>
                <Input id='learning-area-name' value={learningAreaForm.name} onChange={(event) => setLearningAreaForm((current) => ({ ...current, name: event.target.value }))} placeholder='e.g. Computer Science' required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='learning-area-description'>Description</Label>
                <Input id='learning-area-description' value={learningAreaForm.description} onChange={(event) => setLearningAreaForm((current) => ({ ...current, description: event.target.value }))} placeholder='Optional description' />
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={learningAreaForm.status} onValueChange={(value) => setLearningAreaForm((current) => ({ ...current, status: value as LearningAreaStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Active</SelectItem>
                    <SelectItem value='INACTIVE'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='learning-area-sort-order'>Sort Order</Label>
                <Input id='learning-area-sort-order' type='number' min='0' value={learningAreaForm.sortOrder} onChange={(event) => setLearningAreaForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
              </div>
              {learningAreaError ? <p className='text-sm text-destructive'>{learningAreaError}</p> : null}
              <Button type='submit' disabled={isSavingLearningArea}>
                {isSavingLearningArea ? <span className='flex items-center gap-2'><Loader2 className='h-4 w-4 animate-spin' />Saving…</span> : editingLearningAreaId ? 'Update Learning Area' : 'Create Learning Area'}
              </Button>
            </form>

            <div className='space-y-3'>
              {learningAreas.length === 0 ? (
                <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No learning areas yet.</div>
              ) : (
                learningAreas.map((area) => (
                  <div key={area.id} className='rounded-lg border p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='font-semibold'>{area.name}</div>
                        <div className='text-sm text-muted-foreground'>Code: {area.code}</div>
                        {area.description ? <div className='text-sm text-muted-foreground'>{area.description}</div> : null}
                        <div className='text-xs text-muted-foreground mt-1'>Status: {area.status} • Sort order: {area.sortOrder ?? 0} • Competencies: {area._count?.competencies ?? 0}</div>
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm' onClick={() => startEditLearningArea(area)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='outline' size='sm' className='text-destructive' onClick={() => deleteLearningArea(area.id)}><Trash2 className='h-4 w-4' /></Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><BrainCircuit className='h-4 w-4' />Competencies</CardTitle>
            <CardDescription>Attach competencies to a learning area.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleCompetencySubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label>Learning Area</Label>
                <Select value={competencyForm.learningAreaId} onValueChange={(value) => setCompetencyForm((current) => ({ ...current, learningAreaId: value }))}>
                  <SelectTrigger><SelectValue placeholder='Choose a learning area' /></SelectTrigger>
                  <SelectContent>
                    {learningAreas.map((area) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='competency-name'>Name</Label>
                <Input id='competency-name' value={competencyForm.name} onChange={(event) => setCompetencyForm((current) => ({ ...current, name: event.target.value }))} placeholder='e.g. Frontend Development' required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='competency-description'>Description</Label>
                <Input id='competency-description' value={competencyForm.description} onChange={(event) => setCompetencyForm((current) => ({ ...current, description: event.target.value }))} placeholder='Optional description' />
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={competencyForm.status} onValueChange={(value) => setCompetencyForm((current) => ({ ...current, status: value as LearningAreaStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Active</SelectItem>
                    <SelectItem value='INACTIVE'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Difficulty</Label>
                <Select value={competencyForm.difficulty} onValueChange={(value) => setCompetencyForm((current) => ({ ...current, difficulty: value as CompetencyDifficulty }))}>
                  <SelectTrigger><SelectValue placeholder='Select difficulty' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='BEGINNER'>Beginner</SelectItem>
                    <SelectItem value='INTERMEDIATE'>Intermediate</SelectItem>
                    <SelectItem value='ADVANCED'>Advanced</SelectItem>
                    <SelectItem value='EXPERT'>Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='competency-sort-order'>Sort Order</Label>
                <Input id='competency-sort-order' type='number' min='0' value={competencyForm.sortOrder} onChange={(event) => setCompetencyForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
              </div>
              {competencyError ? <p className='text-sm text-destructive'>{competencyError}</p> : null}
              <Button type='submit' disabled={isSavingCompetency}>
                {isSavingCompetency ? <span className='flex items-center gap-2'><Loader2 className='h-4 w-4 animate-spin' />Saving…</span> : editingCompetencyId ? 'Update Competency' : 'Create Competency'}
              </Button>
            </form>

            <div className='space-y-3'>
              {competencies.length === 0 ? (
                <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No competencies yet.</div>
              ) : (
                competencies.map((competency) => (
                  <div key={competency.id} className='rounded-lg border p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='font-semibold'>{competency.name}</div>
                        <div className='text-sm text-muted-foreground'>Code: {competency.code}</div>
                        <div className='text-sm text-muted-foreground'>Learning area: {competency.learningArea?.name || 'Unknown'}</div>
                        {competency.description ? <div className='text-sm text-muted-foreground'>{competency.description}</div> : null}
                        <div className='text-xs text-muted-foreground mt-1'>Status: {competency.status} • Difficulty: {competency.difficulty || 'Not set'} • Sort order: {competency.sortOrder ?? 0}</div>
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm' onClick={() => startEditCompetency(competency)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='outline' size='sm' className='text-destructive' onClick={() => deleteCompetency(competency.id)}><Trash2 className='h-4 w-4' /></Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><ListChecks className='h-4 w-4' />Competency Groups</CardTitle>
            <CardDescription>Create and maintain competency groups for each competency.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleCompetencyGroupSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label>Parent Competency</Label>
                <Select value={competencyGroupForm.competencyId} onValueChange={(value) => setCompetencyGroupForm((current) => ({ ...current, competencyId: value }))}>
                  <SelectTrigger><SelectValue placeholder='Choose a competency' /></SelectTrigger>
                  <SelectContent>
                    {competencies.map((competency) => <SelectItem key={competency.id} value={competency.id}>{competency.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='competency-group-name'>Name</Label>
                <Input id='competency-group-name' value={competencyGroupForm.name} onChange={(event) => setCompetencyGroupForm((current) => ({ ...current, name: event.target.value }))} placeholder='e.g. Frontend Beginner' required />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='competency-group-description'>Description</Label>
                <Input id='competency-group-description' value={competencyGroupForm.description} onChange={(event) => setCompetencyGroupForm((current) => ({ ...current, description: event.target.value }))} placeholder='Optional description' />
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={competencyGroupForm.status} onValueChange={(value) => setCompetencyGroupForm((current) => ({ ...current, status: value as LearningAreaStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Active</SelectItem>
                    <SelectItem value='INACTIVE'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {competencyGroupError ? <p className='text-sm text-destructive'>{competencyGroupError}</p> : null}
              <Button type='submit' disabled={isSavingCompetencyGroup}>
                {isSavingCompetencyGroup ? <span className='flex items-center gap-2'><Loader2 className='h-4 w-4 animate-spin' />Saving…</span> : editingCompetencyGroupId ? 'Update Competency Group' : 'Create Competency Group'}
              </Button>
            </form>

            <div className='space-y-3'>
              {competencyGroups.length === 0 ? (
                <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No competency groups yet.</div>
              ) : (
                competencyGroups.map((group) => (
                  <div key={group.id} className='rounded-lg border p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='font-semibold'>{group.name}</div>
                        <div className='text-sm text-muted-foreground'>Code: {group.code}</div>
                        <div className='text-sm text-muted-foreground'>Parent competency: {group.competency?.name || 'Unknown'}</div>
                        {group.description ? <div className='text-sm text-muted-foreground'>{group.description}</div> : null}
                        <div className='text-xs text-muted-foreground mt-1'>Status: {group.status}</div>
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm' onClick={() => startEditCompetencyGroup(group)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='outline' size='sm' className='text-destructive' onClick={() => deleteCompetencyGroup(group.id)}><Trash2 className='h-4 w-4' /></Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><Users className='h-4 w-4' />Mentor Expertise</CardTitle>
            <CardDescription>Link mentors to competency groups and record expertise notes.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handleMentorCompetencyGroupSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label>Mentor</Label>
                <Select value={mentorCompetencyGroupForm.mentorId} onValueChange={(value) => setMentorCompetencyGroupForm((current) => ({ ...current, mentorId: value }))}>
                  <SelectTrigger><SelectValue placeholder='Choose a mentor' /></SelectTrigger>
                  <SelectContent>
                    {supervisors.map((mentor) => <SelectItem key={mentor.id} value={mentor.id}>{mentor.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Competency Group</Label>
                <Select value={mentorCompetencyGroupForm.competencyGroupId} onValueChange={(value) => setMentorCompetencyGroupForm((current) => ({ ...current, competencyGroupId: value }))}>
                  <SelectTrigger><SelectValue placeholder='Choose a competency group' /></SelectTrigger>
                  <SelectContent>
                    {competencyGroups.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={mentorCompetencyGroupForm.status} onValueChange={(value) => setMentorCompetencyGroupForm((current) => ({ ...current, status: value as LearningAreaStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>Active</SelectItem>
                    <SelectItem value='INACTIVE'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='mentor-expertise-notes'>Notes</Label>
                <Input id='mentor-expertise-notes' value={mentorCompetencyGroupForm.notes} onChange={(event) => setMentorCompetencyGroupForm((current) => ({ ...current, notes: event.target.value }))} placeholder='Optional notes' />
              </div>
              {mentorCompetencyGroupError ? <p className='text-sm text-destructive'>{mentorCompetencyGroupError}</p> : null}
              <Button type='submit' disabled={isSavingMentorCompetencyGroup}>
                {isSavingMentorCompetencyGroup ? <span className='flex items-center gap-2'><Loader2 className='h-4 w-4 animate-spin' />Saving…</span> : editingMentorCompetencyGroupId ? 'Update Mentor Expertise' : 'Create Mentor Expertise'}
              </Button>
            </form>

            <div className='space-y-3'>
              {mentorCompetencyGroups.length === 0 ? (
                <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No mentor expertise yet.</div>
              ) : (
                mentorCompetencyGroups.map((entry) => (
                  <div key={entry.id} className='rounded-lg border p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='font-semibold'>{entry.mentor.user.name}</div>
                        <div className='text-sm text-muted-foreground'>Competency group: {entry.competencyGroup.name}</div>
                        <div className='text-sm text-muted-foreground'>Parent competency: {entry.competencyGroup.competency.name}</div>
                        {entry.notes ? <div className='text-sm text-muted-foreground'>{entry.notes}</div> : null}
                        <div className='text-xs text-muted-foreground mt-1'>Status: {entry.status}</div>
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm' onClick={() => startEditMentorCompetencyGroup(entry)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='outline' size='sm' className='text-destructive' onClick={() => deleteMentorCompetencyGroup(entry.id)}><Trash2 className='h-4 w-4' /></Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
