'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { AlertCircle, BookOpen, BrainCircuit, Edit, Loader2, Trash2 } from 'lucide-react'

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

export default function LearningArchitecturePage() {
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSavingLearningArea, setIsSavingLearningArea] = useState(false)
  const [isSavingCompetency, setIsSavingCompetency] = useState(false)
  const [learningAreaError, setLearningAreaError] = useState<string | null>(null)
  const [competencyError, setCompetencyError] = useState<string | null>(null)
  const [learningAreaForm, setLearningAreaForm] = useState<LearningAreaFormState>(getInitialLearningAreaForm)
  const [competencyForm, setCompetencyForm] = useState<CompetencyFormState>(getInitialCompetencyForm)
  const [editingLearningAreaId, setEditingLearningAreaId] = useState<string | null>(null)
  const [editingCompetencyId, setEditingCompetencyId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoadError(null)
      const [areasResponse, competenciesResponse] = await Promise.all([
        fetch('/api/admin/learning-areas'),
        fetch('/api/admin/competencies'),
      ])
      const areasData = await areasResponse.json()
      const competenciesData = await competenciesResponse.json()

      if (!areasResponse.ok || !areasData.success) {
        throw new Error(areasData.error || 'Failed to load learning areas')
      }

      if (!competenciesResponse.ok || !competenciesData.success) {
        throw new Error(competenciesData.error || 'Failed to load competencies')
      }

      setLearningAreas(areasData.learningAreas ?? [])
      setCompetencies(competenciesData.competencies ?? [])
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
      </div>
    </div>
  )
}
