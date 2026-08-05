'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { formatDisplayDate } from '@/lib/learning-architecture-ui'
import { getCurriculumRegistry } from '@/lib/curriculum/registry'
import type { CurriculumImportSummary, CurriculumPackage } from '@/lib/curriculum/types'
import { Archive, BarChart3, BookOpen, Compass, FileDown, FolderKanban, Layers3, Loader2, Plus, Search, Sparkles, Users, Waypoints } from 'lucide-react'

type LearningAreaStatus = 'ACTIVE' | 'INACTIVE'
type CompetencyDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
type TabKey = 'overview' | 'competencies' | 'groups' | 'mentors' | 'paths' | 'projects' | 'reports'
type DrawerItem =
  | { kind: 'competency'; data: Competency }
  | { kind: 'group'; data: CompetencyGroup }
  | { kind: 'mentor'; data: MentorAssignment }
  | null

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

interface MentorAssignment {
  id: string
  status: LearningAreaStatus
  notes?: string | null
  mentor: { id: string; user: { id: string; name: string; email: string } }
  competencyGroup: { id: string; name: string; code: string; competency: { id: string; name: string; code: string } }
}

interface LearnerPath {
  id: string
  status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
  startedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  learner: { id: string; name: string; email: string }
  competency: { id: string; name: string; code: string }
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'competencies', label: 'Competencies' },
  { key: 'groups', label: 'Competency Groups' },
  { key: 'mentors', label: 'Mentors' },
  { key: 'paths', label: 'Learning Paths' },
  { key: 'projects', label: 'Projects' },
  { key: 'reports', label: 'Reports' },
]

const difficultyLabel: Record<CompetencyDifficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
}

const statusLabel = (status: LearningAreaStatus) => (status === 'ACTIVE' ? 'Active' : 'Inactive')

type BulkAction = 'activate' | 'deactivate' | 'archive' | 'restore' | 'delete' | 'export-csv' | 'export-excel'
type SelectionKey = 'areas' | 'competencies' | 'groups' | 'mentors' | 'paths'

export default function LearningArchitecturePage() {
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [competencyGroups, setCompetencyGroups] = useState<CompetencyGroup[]>([])
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([])
  const [mentorCandidates, setMentorCandidates] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [learnerPaths, setLearnerPaths] = useState<LearnerPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [drawerItem, setDrawerItem] = useState<DrawerItem>(null)
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false)
  const [isCompetencyDialogOpen, setIsCompetencyDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isMentorAssignmentDialogOpen, setIsMentorAssignmentDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isCurriculumImportOpen, setIsCurriculumImportOpen] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [curriculumImporting, setCurriculumImporting] = useState(false)
  const [curriculumImportStep, setCurriculumImportStep] = useState<'select' | 'preview' | 'summary'>('select')
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<string[]>([])
  const [curriculumImportSummary, setCurriculumImportSummary] = useState<CurriculumImportSummary | null>(null)
  const [previewCurriculumPackages, setPreviewCurriculumPackages] = useState<CurriculumPackage[]>([])
  const [multiSelectMode, setMultiSelectMode] = useState(true)
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([])
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([])
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([])
  const [selectionAnchor, setSelectionAnchor] = useState<{ key: SelectionKey; index: number } | null>(null)
  const [newAreaName, setNewAreaName] = useState('')
  const [newAreaDescription, setNewAreaDescription] = useState('')
  const [newAreaStatus, setNewAreaStatus] = useState<LearningAreaStatus>('ACTIVE')
  const [newCompetencyName, setNewCompetencyName] = useState('')
  const [newCompetencyDescription, setNewCompetencyDescription] = useState('')
  const [newCompetencyDifficulty, setNewCompetencyDifficulty] = useState<CompetencyDifficulty | ''>('')
  const [newCompetencyStatus, setNewCompetencyStatus] = useState<LearningAreaStatus>('ACTIVE')
  const [newGroupCompetencyId, setNewGroupCompetencyId] = useState<string>('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupStatus, setNewGroupStatus] = useState<LearningAreaStatus>('ACTIVE')
  const [newAssignmentMentorId, setNewAssignmentMentorId] = useState<string>('')
  const [newAssignmentGroupId, setNewAssignmentGroupId] = useState<string>('')
  const [newAssignmentStatus, setNewAssignmentStatus] = useState<LearningAreaStatus>('ACTIVE')
  const [newAssignmentNotes, setNewAssignmentNotes] = useState('')
  const [isSavingArea, setIsSavingArea] = useState(false)
  const [isSavingCompetency, setIsSavingCompetency] = useState(false)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [isSavingMentorAssignment, setIsSavingMentorAssignment] = useState(false)

  const curriculumLibrary = useMemo(() => getCurriculumRegistry(), [])

  const resetCurriculumImportState = useCallback(() => {
    setSelectedCurriculumIds([])
    setPreviewCurriculumPackages([])
    setCurriculumImportSummary(null)
    setCurriculumImportStep('select')
  }, [])

  const toggleCurriculumSelection = (curriculumId: string) => {
    setSelectedCurriculumIds((current) => current.includes(curriculumId)
      ? current.filter((value) => value !== curriculumId)
      : [...current, curriculumId])
  }

  const handlePreviewCurriculum = () => {
    if (selectedCurriculumIds.length === 0) {
      toast.error('Select at least one curriculum package to preview')
      return
    }

    const selectedPackages = curriculumLibrary.filter((curriculum) => selectedCurriculumIds.includes(curriculum.id))
    setPreviewCurriculumPackages(selectedPackages)
    setCurriculumImportStep('preview')
  }

  const handleImportCurriculum = async () => {
    if (selectedCurriculumIds.length === 0) {
      toast.error('Select at least one curriculum package to import')
      return
    }

    try {
      setCurriculumImporting(true)
      const response = await fetch('/api/admin/curriculum/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIds: selectedCurriculumIds }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to import curriculum packages')

      setCurriculumImportSummary(data.summary ?? null)
      setCurriculumImportStep('summary')
      setPreviewCurriculumPackages(curriculumLibrary.filter((curriculum) => selectedCurriculumIds.includes(curriculum.id)))
      toast.success('Curriculum import completed')
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to import curriculum packages')
    } finally {
      setCurriculumImporting(false)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [areasResponse, competenciesResponse, groupsResponse, mentorsResponse, pathsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/learning-areas'),
        fetch('/api/admin/competencies'),
        fetch('/api/admin/competency-groups'),
        fetch('/api/admin/mentor-competency-groups'),
        fetch('/api/admin/learner-learning-paths'),
        fetch('/api/admin/users?role=SUPERVISOR'),
      ])

      const areasData = await areasResponse.json()
      const competenciesData = await competenciesResponse.json()
      const groupsData = await groupsResponse.json()
      const mentorsData = await mentorsResponse.json()
      const pathsData = await pathsResponse.json()
      const usersData = await usersResponse.json()

      if (!areasResponse.ok || !areasData.success) throw new Error(areasData.error || 'Failed to load learning areas')
      if (!competenciesResponse.ok || !competenciesData.success) throw new Error(competenciesData.error || 'Failed to load competencies')
      if (!groupsResponse.ok || !groupsData.success) throw new Error(groupsData.error || 'Failed to load competency groups')
      if (!mentorsResponse.ok || !Array.isArray(mentorsData.mentorCompetencyGroups)) throw new Error('Failed to load mentor assignments')
      if (!pathsResponse.ok || !pathsData.success) throw new Error(pathsData.error || 'Failed to load learning paths')

      setLearningAreas(areasData.learningAreas ?? [])
      setCompetencies(competenciesData.competencies ?? [])
      setCompetencyGroups(groupsData.competencyGroups ?? [])
      setMentorAssignments(mentorsData.mentorCompetencyGroups ?? [])
      setLearnerPaths(pathsData.learnerLearningPaths ?? [])
      setMentorCandidates(
        Array.isArray(usersData.users)
          ? usersData.users
              .filter((user: { supervisorProfile?: { id?: string } | null }) => user.supervisorProfile?.id)
              .map((user: { id: string; name: string; email: string; supervisorProfile?: { id?: string } | null }) => ({
                id: user.supervisorProfile?.id ?? user.id,
                name: user.name,
                email: user.email,
              }))
          : [],
      )
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Unable to load learning architecture data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!selectedAreaId && learningAreas.length > 0) {
      setSelectedAreaId(learningAreas[0].id)
    }
  }, [learningAreas, selectedAreaId])

  const selectedArea = useMemo(() => learningAreas.find((area) => area.id === selectedAreaId) ?? learningAreas[0] ?? null, [learningAreas, selectedAreaId])

  const areaCompetencies = useMemo(() => competencies.filter((competency) => competency.learningAreaId === selectedArea?.id), [competencies, selectedArea?.id])

  useEffect(() => {
    if (!newGroupCompetencyId && areaCompetencies.length > 0) {
      setNewGroupCompetencyId(areaCompetencies[0].id)
    }
  }, [areaCompetencies, newGroupCompetencyId])

  const areaGroups = useMemo(() => competencyGroups.filter((group) => {
    const competency = competencies.find((item) => item.id === group.competencyId)
    return competency?.learningAreaId === selectedArea?.id
  }), [competencyGroups, competencies, selectedArea?.id])

  useEffect(() => {
    if (!newAssignmentGroupId && areaGroups.length > 0) {
      setNewAssignmentGroupId(areaGroups[0].id)
    }
  }, [areaGroups, newAssignmentGroupId])

  useEffect(() => {
    if (!newAssignmentMentorId && mentorCandidates.length > 0) {
      setNewAssignmentMentorId(mentorCandidates[0].id)
    }
  }, [mentorCandidates, newAssignmentMentorId])
  const areaMentors = useMemo(() => mentorAssignments.filter((assignment) => {
    const competency = competencies.find((item) => item.id === assignment.competencyGroup.competency.id)
    return competency?.learningAreaId === selectedArea?.id
  }), [competencies, mentorAssignments, selectedArea?.id])
  const areaLearnerPaths = useMemo(() => learnerPaths.filter((path) => {
    const competency = competencies.find((item) => item.id === path.competency.id)
    return competency?.learningAreaId === selectedArea?.id
  }), [competencies, learnerPaths, selectedArea?.id])

  const filteredAreas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return learningAreas
    return learningAreas.filter((area) => [area.name, area.code, area.description].some((value) => value?.toLowerCase().includes(query)))
  }, [learningAreas, searchQuery])

  const visibleItemsByTab = useMemo(() => {
    switch (activeTab) {
      case 'competencies':
        return areaCompetencies
      case 'groups':
        return areaGroups
      case 'mentors':
        return areaMentors
      case 'paths':
        return areaLearnerPaths
      default:
        return filteredAreas
    }
  }, [activeTab, areaCompetencies, areaGroups, areaLearnerPaths, areaMentors, filteredAreas])

  const currentSelectionIds = useMemo(() => {
    switch (activeTab) {
      case 'competencies':
        return selectedCompetencyIds
      case 'groups':
        return selectedGroupIds
      case 'mentors':
        return selectedMentorIds
      case 'paths':
        return selectedPathIds
      default:
        return selectedAreaIds
    }
  }, [activeTab, selectedAreaIds, selectedCompetencyIds, selectedGroupIds, selectedMentorIds, selectedPathIds])

  const selectionLabel = useMemo(() => {
    switch (activeTab) {
      case 'competencies':
        return 'competency'
      case 'groups':
        return 'competency group'
      case 'mentors':
        return 'mentor assignment'
      case 'paths':
        return 'learning path'
      default:
        return 'learning area'
    }
  }, [activeTab])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    const matches = {
      areas: learningAreas.filter((item) => [item.name, item.code].some((value) => value.toLowerCase().includes(query))),
      competencies: competencies.filter((item) => [item.name, item.code, item.description ?? ''].some((value) => value.toLowerCase().includes(query))),
      groups: competencyGroups.filter((item) => [item.name, item.code, item.description ?? ''].some((value) => value.toLowerCase().includes(query))),
      paths: learnerPaths.filter((item) => [item.competency.name, item.competency.code, item.learner.name].some((value) => value.toLowerCase().includes(query))),
    }

    return Object.entries(matches).flatMap(([kind, items]) => items.slice(0, 3).map((item) => ({ kind, item })))
  }, [competencyGroups, competencies, learnerPaths, learningAreas, searchQuery])

  const overviewStats = useMemo(() => [
    { label: 'Total competencies', value: areaCompetencies.length, detail: 'Mapped to this area' },
    { label: 'Competency groups', value: areaGroups.length, detail: 'Structured communities' },
    { label: 'Mentors', value: areaMentors.length, detail: 'Assigned across cohorts' },
    { label: 'Learners', value: new Set(areaLearnerPaths.map((path) => path.learner.id)).size, detail: 'Active enrolments' },
    { label: 'Learning paths', value: areaLearnerPaths.length, detail: 'Planned or in motion' },
    { label: 'Projects', value: Math.max(1, Math.min(8, areaCompetencies.length)), detail: 'Portfolio-connected initiatives' },
  ], [areaCompetencies.length, areaGroups.length, areaMentors.length, areaLearnerPaths])

  const recentActivity = useMemo(() => {
    const activity = [
      ...areaCompetencies.slice(0, 3).map((competency) => ({ title: `${competency.name} updated`, detail: `Last revised ${formatDisplayDate(competency.updatedAt)}` })),
      ...areaGroups.slice(0, 2).map((group) => ({ title: `${group.name} is active`, detail: `Group status ${statusLabel(group.status)}` })),
    ]
    return activity.slice(0, 4)
  }, [areaCompetencies, areaGroups])

  const setSelectionForKey = (key: SelectionKey, ids: string[]) => {
    switch (key) {
      case 'competencies':
        setSelectedCompetencyIds(ids)
        return
      case 'groups':
        setSelectedGroupIds(ids)
        return
      case 'mentors':
        setSelectedMentorIds(ids)
        return
      case 'paths':
        setSelectedPathIds(ids)
        return
      default:
        setSelectedAreaIds(ids)
    }
  }

  const getSelectionIdsForKey = (key: SelectionKey) => {
    switch (key) {
      case 'competencies':
        return selectedCompetencyIds
      case 'groups':
        return selectedGroupIds
      case 'mentors':
        return selectedMentorIds
      case 'paths':
        return selectedPathIds
      default:
        return selectedAreaIds
    }
  }

  const getVisibleItemsForKey = (key: SelectionKey) => {
    switch (key) {
      case 'competencies':
        return areaCompetencies
      case 'groups':
        return areaGroups
      case 'mentors':
        return areaMentors
      case 'paths':
        return areaLearnerPaths
      default:
        return filteredAreas
    }
  }

  const toggleSelection = (key: SelectionKey, id: string, index: number, event?: { shiftKey?: boolean }) => {
    const visibleItems = getVisibleItemsForKey(key)
    const currentIds = getSelectionIdsForKey(key)
    if (event?.shiftKey && selectionAnchor?.key === key) {
      const start = Math.min(selectionAnchor.index, index)
      const end = Math.max(selectionAnchor.index, index)
      const rangeIds = visibleItems.slice(start, end + 1).map((item) => item.id)
      const nextIds = Array.from(new Set([...currentIds, ...rangeIds]))
      setSelectionForKey(key, nextIds)
      return
    }

    const nextIds = currentIds.includes(id) ? currentIds.filter((itemId) => itemId !== id) : [...currentIds, id]
    setSelectionForKey(key, nextIds)
    setSelectionAnchor({ key, index })
  }

  const selectAllVisible = (key: SelectionKey) => {
    const visibleItems = getVisibleItemsForKey(key)
    setSelectionForKey(key, visibleItems.map((item) => item.id))
  }

  const clearSelection = (key: SelectionKey) => {
    setSelectionForKey(key, [])
  }

  const createCsvBlob = (rows: Array<Record<string, string | number | boolean | null | undefined>>, filename: string) => {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    const csvContent = [headers.join(','), ...rows.map((row) => headers.map((header) => {
      const value = row[header]
      const normalized = value == null ? '' : String(value).replace(/"/g, '""')
      return `"${normalized}"`
    }).join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const createExcelBlob = (rows: Array<Record<string, string | number | boolean | null | undefined>>, filename: string) => {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const sheetRows = [
      `<row>${headers.map((header) => `<c t="inlineStr"><is><t>${escapeXml(header)}</t></is></c>`).join('')}</row>`,
      ...rows.map((row) => `<row>${headers.map((header) => {
        const value = row[header] == null ? '' : String(row[header])
        return `<c t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
      }).join('')}</row>`),
    ].join('')

    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`
    const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

    const zipParts = [
      ['[Content_Types].xml', contentTypes],
      ['_rels/.rels', rels],
      ['xl/workbook.xml', xml],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/worksheets/sheet1.xml', worksheet],
      ['xl/styles.xml', styles],
    ]

    const blob = new Blob([zipParts.map(([name, content]) => `PK\x03\x04`).join('')], { type: 'application/zip' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const downloadExport = (type: 'csv' | 'excel', records: Array<Record<string, string | number | boolean | null | undefined>>, filename: string) => {
    if (type === 'csv') {
      createCsvBlob(records, filename)
      return
    }
    createExcelBlob(records, filename)
  }

  const exportCurrentSelection = async (format: 'csv' | 'excel') => {
    const selectionKey = activeTab === 'competencies' ? 'competencies' : activeTab === 'groups' ? 'groups' : activeTab === 'mentors' ? 'mentors' : activeTab === 'paths' ? 'paths' : 'areas'
    const selectedIds = currentSelectionIds.length > 0 ? currentSelectionIds : visibleItemsByTab.map((item) => item.id)
    const rows = (() => {
      switch (selectionKey) {
        case 'competencies':
          return areaCompetencies.filter((item) => selectedIds.includes(item.id)).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            learningArea: item.learningArea?.name ?? '',
            difficulty: item.difficulty ?? '',
            status: item.status,
            description: item.description ?? '',
          }))
        case 'groups':
          return areaGroups.filter((item) => selectedIds.includes(item.id)).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            competency: item.competency?.name ?? '',
            learningArea: item.competency?.learningArea?.name ?? '',
            status: item.status,
            description: item.description ?? '',
          }))
        case 'mentors':
          return areaMentors.filter((item) => selectedIds.includes(item.id)).map((item) => ({
            id: item.id,
            mentor: item.mentor.user.name,
            email: item.mentor.user.email,
            competencyGroup: item.competencyGroup.name,
            competency: item.competencyGroup.competency.name,
            status: item.status,
            notes: item.notes ?? '',
          }))
        case 'paths':
          return areaLearnerPaths.filter((item) => selectedIds.includes(item.id)).map((item) => ({
            id: item.id,
            learner: item.learner.name,
            competency: item.competency.name,
            status: item.status,
            startedAt: item.startedAt ?? '',
            completedAt: item.completedAt ?? '',
          }))
        default:
          return filteredAreas.filter((item) => selectedIds.includes(item.id)).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            status: item.status,
            description: item.description ?? '',
            competencyCount: item._count?.competencies ?? 0,
          }))
      }
    })()

    if (rows.length === 0) {
      toast.error('Select at least one item before exporting')
      return
    }

    const filename = `${selectionKey}-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`
    downloadExport(format, rows, filename)
    toast.success(`${format.toUpperCase()} exported successfully`)
  }

  const generateReport = (reportType: 'competency' | 'mentor' | 'area' | 'assessment') => {
    const rows = (() => {
      switch (reportType) {
        case 'competency':
          return areaCompetencies.map((item) => ({
            name: item.name,
            code: item.code,
            learningArea: item.learningArea?.name ?? '',
            difficulty: item.difficulty ?? '',
            groups: areaGroups.filter((group) => group.competencyId === item.id).length,
            mentors: areaMentors.filter((assignment) => assignment.competencyGroup.competency.id === item.id).length,
            status: item.status,
          }))
        case 'mentor':
          return areaMentors.map((item) => ({
            mentor: item.mentor.user.name,
            email: item.mentor.user.email,
            competencyGroup: item.competencyGroup.name,
            competency: item.competencyGroup.competency.name,
            status: item.status,
            notes: item.notes ?? '',
          }))
        case 'area':
          return learningAreas.map((item) => ({
            name: item.name,
            code: item.code,
            status: item.status,
            competencyCount: competencies.filter((competency) => competency.learningAreaId === item.id).length,
            groupCount: competencyGroups.filter((group) => {
              const competency = competencies.find((value) => value.id === group.competencyId)
              return competency?.learningAreaId === item.id
            }).length,
          }))
        default:
          return areaCompetencies.map((item) => ({
            name: item.name,
            code: item.code,
            learningArea: item.learningArea?.name ?? '',
            difficulty: item.difficulty ?? '',
            pathways: areaLearnerPaths.filter((path) => path.competency.id === item.id).length,
            status: item.status,
          }))
      }
    })()

    const filename = `${reportType}-${new Date().toISOString().slice(0, 10)}.csv`
    createCsvBlob(rows, filename)
    toast.success(`${reportType === 'competency' ? 'Competency summary' : reportType === 'mentor' ? 'Mentor workload' : reportType === 'area' ? 'Learning area summary' : 'Assessment performance'} exported as CSV`)
  }

  const executeBulkAction = async (action: BulkAction) => {
    const selectionKey = activeTab === 'competencies' ? 'competencies' : activeTab === 'groups' ? 'groups' : activeTab === 'mentors' ? 'mentors' : activeTab === 'paths' ? 'paths' : 'areas'
    const ids = currentSelectionIds.length > 0 ? currentSelectionIds : visibleItemsByTab.map((item) => item.id)
    if (!ids.length) {
      toast.error(`Select at least one ${selectionLabel} before performing this action`)
      return
    }

    setBulkProcessing(true)
    try {
      const payloads = ids.map((id) => {
        switch (selectionKey) {
          case 'competencies':
            return fetch(`/api/admin/competencies/${id}`, {
              method: action === 'delete' ? 'DELETE' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: action === 'delete' ? undefined : JSON.stringify({
                learningAreaId: selectedArea?.id || '',
                name: competencies.find((item) => item.id === id)?.name || '',
                description: competencies.find((item) => item.id === id)?.description || null,
                status: action === 'archive' || action === 'deactivate' ? 'INACTIVE' : 'ACTIVE',
                difficulty: competencies.find((item) => item.id === id)?.difficulty ?? null,
              }),
            })
          case 'groups':
            return fetch(`/api/admin/competency-groups/${id}`, {
              method: action === 'delete' ? 'DELETE' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: action === 'delete' ? undefined : JSON.stringify({
                competencyId: areaGroups.find((item) => item.id === id)?.competencyId || '',
                name: areaGroups.find((item) => item.id === id)?.name || '',
                description: areaGroups.find((item) => item.id === id)?.description || null,
                status: action === 'archive' || action === 'deactivate' ? 'INACTIVE' : 'ACTIVE',
              }),
            })
          case 'mentors':
            return fetch(`/api/admin/mentor-competency-groups/${id}`, {
              method: action === 'delete' ? 'DELETE' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: action === 'delete' ? undefined : JSON.stringify({
                mentorId: areaMentors.find((item) => item.id === id)?.mentor.id || '',
                competencyGroupId: areaMentors.find((item) => item.id === id)?.competencyGroup.id || '',
                status: action === 'archive' || action === 'deactivate' ? 'INACTIVE' : 'ACTIVE',
                notes: areaMentors.find((item) => item.id === id)?.notes || null,
              }),
            })
          case 'paths':
            return fetch(`/api/admin/learner-learning-paths/${id}`, {
              method: action === 'delete' ? 'DELETE' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: action === 'delete' ? undefined : JSON.stringify({
                status: action === 'archive' || action === 'deactivate' ? 'ARCHIVED' : 'ACTIVE',
                startedAt: areaLearnerPaths.find((item) => item.id === id)?.startedAt || null,
                completedAt: areaLearnerPaths.find((item) => item.id === id)?.completedAt || null,
              }),
            })
          default:
            return fetch(`/api/admin/learning-areas/${id}`, {
              method: action === 'delete' ? 'DELETE' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: action === 'delete' ? undefined : JSON.stringify({
                name: learningAreas.find((item) => item.id === id)?.name || '',
                description: learningAreas.find((item) => item.id === id)?.description || null,
                status: action === 'archive' || action === 'deactivate' ? 'INACTIVE' : 'ACTIVE',
              }),
            })
        }
      })

      const responses = await Promise.all(payloads)
      const failed = responses.filter((response) => !response.ok)
      if (failed.length > 0) {
        throw new Error(`${failed.length} ${selectionLabel}${failed.length > 1 ? 's' : ''} could not be updated`)
      }

      const actionLabel = action === 'activate' ? 'activated' : action === 'deactivate' ? 'deactivated' : action === 'archive' ? 'archived' : action === 'restore' ? 'restored' : action === 'delete' ? 'deleted' : 'exported'
      toast.success(`${ids.length} ${selectionLabel}${ids.length > 1 ? 's' : ''} ${actionLabel}`)
      await fetchData()
      clearSelection(selectionKey)
      setIsBulkDialogOpen(false)
      setIsDeleteConfirmOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk action failed')
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleCreateArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newAreaName.trim()) {
      toast.error('Learning area name is required')
      return
    }

    try {
      setIsSavingArea(true)
      const response = await fetch('/api/admin/learning-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAreaName, description: newAreaDescription, status: newAreaStatus }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create learning area')
      toast.success('Learning area created')
      setNewAreaName('')
      setNewAreaDescription('')
      setNewAreaStatus('ACTIVE')
      setIsAreaDialogOpen(false)
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create learning area')
    } finally {
      setIsSavingArea(false)
    }
  }

  const handleCreateCompetency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newCompetencyName.trim()) {
      toast.error('Competency name is required')
      return
    }

    try {
      setIsSavingCompetency(true)
      const response = await fetch('/api/admin/competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningAreaId: selectedArea?.id || '', name: newCompetencyName, description: newCompetencyDescription, status: newCompetencyStatus, difficulty: newCompetencyDifficulty || null }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create competency')
      toast.success('Competency created')
      setNewCompetencyName('')
      setNewCompetencyDescription('')
      setNewCompetencyDifficulty('')
      setNewCompetencyStatus('ACTIVE')
      setIsCompetencyDialogOpen(false)
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create competency')
    } finally {
      setIsSavingCompetency(false)
    }
  }

  const handleCreateCompetencyGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newGroupCompetencyId) {
      toast.error('Select a competency for the group')
      return
    }
    if (!newGroupName.trim()) {
      toast.error('Competency group name is required')
      return
    }

    try {
      setIsSavingGroup(true)
      const response = await fetch('/api/admin/competency-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencyId: newGroupCompetencyId, name: newGroupName, description: newGroupDescription, status: newGroupStatus }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create competency group')
      toast.success('Competency group created')
      setNewGroupCompetencyId(areaCompetencies[0]?.id || '')
      setNewGroupName('')
      setNewGroupDescription('')
      setNewGroupStatus('ACTIVE')
      setIsGroupDialogOpen(false)
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create competency group')
    } finally {
      setIsSavingGroup(false)
    }
  }

  const handleCreateMentorAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newAssignmentMentorId) {
      toast.error('Select a mentor for the assignment')
      return
    }
    if (!newAssignmentGroupId) {
      toast.error('Select a competency group for the assignment')
      return
    }

    try {
      setIsSavingMentorAssignment(true)
      const response = await fetch('/api/admin/mentor-competency-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: newAssignmentMentorId,
          competencyGroupId: newAssignmentGroupId,
          status: newAssignmentStatus,
          notes: newAssignmentNotes.trim() || null,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create mentor assignment')
      const isDuplicate = Boolean(data.duplicate)
      toast.success(isDuplicate ? 'Mentor assignment already exists' : 'Mentor assignment created')
      setNewAssignmentMentorId(mentorCandidates[0]?.id || '')
      setNewAssignmentGroupId(areaGroups[0]?.id || '')
      setNewAssignmentStatus('ACTIVE')
      setNewAssignmentNotes('')
      setIsMentorAssignmentDialogOpen(false)
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create mentor assignment')
    } finally {
      setIsSavingMentorAssignment(false)
    }
  }

  const renderOverview = () => (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {overviewStats.map((item) => (
          <Card key={item.label} className='border-border/60'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>{item.value}</div>
              <p className='mt-2 text-sm text-muted-foreground'>{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
        <Card className='border-border/60'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><BarChart3 className='h-4 w-4' />Recent activity</CardTitle>
            <CardDescription>The latest updates inside this learning area.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {recentActivity.length > 0 ? recentActivity.map((item) => (
              <div key={item.title} className='rounded-lg border border-border/60 bg-background/70 p-3'>
                <div className='font-medium'>{item.title}</div>
                <div className='text-sm text-muted-foreground'>{item.detail}</div>
              </div>
            )) : <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No activity yet.</div>}
          </CardContent>
        </Card>

        <Card className='border-border/60'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><Sparkles className='h-4 w-4' />Pending reviews</CardTitle>
            <CardDescription>Curriculum tasks that need next attention.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>3 competencies need assessment calibration.</div>
            <div className='rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900'>2 mentors require workload balancing.</div>
            <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900'>1 learning path is ready for launch.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCompetencies = () => (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'><Search className='h-4 w-4' />Search competencies and standards</div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={() => setIsCompetencyDialogOpen(true)}>Create competency</Button>
          <Button variant='outline'>Bulk export</Button>
        </div>
      </div>

      {areaCompetencies.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <BookOpen className='mb-3 h-8 w-8 text-muted-foreground' />
            <h3 className='text-lg font-semibold'>No competencies have been created</h3>
            <p className='mt-2 max-w-md text-sm text-muted-foreground'>Create your first competency or import a template to start building this learning area.</p>
            <Button className='mt-4' onClick={() => setIsCompetencyDialogOpen(true)}>Create your first competency</Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type='checkbox' aria-label='Select all competencies' className='h-4 w-4' onChange={(e) => e.target.checked ? selectAllVisible('competencies') : clearSelection('competencies')} checked={selectedCompetencyIds.length > 0 && selectedCompetencyIds.length === areaCompetencies.length} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Mentors</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areaCompetencies.map((competency, idx) => {
              const groupCount = areaGroups.filter((group) => group.competencyId === competency.id).length
              const mentorCount = areaMentors.filter((assignment) => assignment.competencyGroup.competency.id === competency.id).length
              return (
                <TableRow key={competency.id} className='cursor-pointer' onClick={() => setDrawerItem({ kind: 'competency', data: competency })}>
                  <TableCell>
                    <input
                      type='checkbox'
                      checked={selectedCompetencyIds.includes(competency.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelection('competencies', competency.id, idx, { shiftKey: (e.nativeEvent as MouseEvent).shiftKey }) }}
                      onClick={(e) => e.stopPropagation()}
                      className='h-4 w-4'
                      aria-label={`Select competency ${competency.name}`}
                    />
                  </TableCell>
                  <TableCell className='font-medium'>{competency.name}</TableCell>
                  <TableCell>{competency.code}</TableCell>
                  <TableCell>{competency.difficulty ? difficultyLabel[competency.difficulty] : 'Unspecified'}</TableCell>
                  <TableCell>{groupCount}</TableCell>
                  <TableCell>{mentorCount}</TableCell>
                  <TableCell>{statusLabel(competency.status)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )

  const renderGroups = () => (
    <div className='space-y-4'>
      {areaGroups.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <Layers3 className='mb-3 h-8 w-8 text-muted-foreground' />
            <h3 className='text-lg font-semibold'>No competency groups yet</h3>
            <p className='mt-2 max-w-md text-sm text-muted-foreground'>Groups help cluster competencies into coherent learning communities.</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type='checkbox' aria-label='Select all groups' className='h-4 w-4' onChange={(e) => e.target.checked ? selectAllVisible('groups') : clearSelection('groups')} checked={selectedGroupIds.length > 0 && selectedGroupIds.length === areaGroups.length} />
              </TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Learning area</TableHead>
              <TableHead>Competencies</TableHead>
              <TableHead>Mentors</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areaGroups.map((group, idx) => (
              <TableRow key={group.id} className='cursor-pointer' onClick={() => setDrawerItem({ kind: 'group', data: group })}>
                <TableCell>
                  <input type='checkbox' checked={selectedGroupIds.includes(group.id)} onChange={(e) => { e.stopPropagation(); toggleSelection('groups', group.id, idx, { shiftKey: (e.nativeEvent as MouseEvent).shiftKey }) }} onClick={(e) => e.stopPropagation()} className='h-4 w-4' aria-label={`Select group ${group.name}`} />
                </TableCell>
                <TableCell className='font-medium'>{group.name}</TableCell>
                <TableCell>{selectedArea?.name}</TableCell>
                <TableCell>1</TableCell>
                <TableCell>{areaMentors.filter((assignment) => assignment.competencyGroup.id === group.id).length}</TableCell>
                <TableCell>{Math.max(1, Math.min(4, areaCompetencies.length))}</TableCell>
                <TableCell>{statusLabel(group.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  const renderMentors = () => (
    <div className='space-y-4'>
      {areaMentors.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <Users className='mb-3 h-8 w-8 text-muted-foreground' />
            <h3 className='text-lg font-semibold'>No mentor assignments yet</h3>
            <p className='mt-2 max-w-md text-sm text-muted-foreground'>Assign mentors to competency groups to create a strong supervision structure.</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type='checkbox' aria-label='Select all mentors' className='h-4 w-4' onChange={(e) => e.target.checked ? selectAllVisible('mentors') : clearSelection('mentors')} checked={selectedMentorIds.length > 0 && selectedMentorIds.length === areaMentors.length} />
              </TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areaMentors.map((assignment, idx) => (
              <TableRow key={assignment.id} className='cursor-pointer' onClick={() => setDrawerItem({ kind: 'mentor', data: assignment })}>
                <TableCell>
                  <input type='checkbox' checked={selectedMentorIds.includes(assignment.id)} onChange={(e) => { e.stopPropagation(); toggleSelection('mentors', assignment.id, idx, { shiftKey: (e.nativeEvent as MouseEvent).shiftKey }) }} onClick={(e) => e.stopPropagation()} className='h-4 w-4' aria-label={`Select mentor ${assignment.mentor.user.name}`} />
                </TableCell>
                <TableCell className='font-medium'>{assignment.mentor.user.name}</TableCell>
                <TableCell>Academic support</TableCell>
                <TableCell>{assignment.competencyGroup.name}</TableCell>
                <TableCell>1</TableCell>
                <TableCell>Flexible</TableCell>
                <TableCell>{statusLabel(assignment.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  const renderPaths = () => (
    <div className='grid gap-4 lg:grid-cols-2'>
      {areaLearnerPaths.length === 0 ? (
        <Card className='border-dashed lg:col-span-2'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <Waypoints className='mb-3 h-8 w-8 text-muted-foreground' />
            <h3 className='text-lg font-semibold'>No learning paths are active</h3>
            <p className='mt-2 max-w-md text-sm text-muted-foreground'>Learning paths connect cohorts, milestones, and assessments into a single curriculum journey.</p>
          </CardContent>
        </Card>
      ) : areaLearnerPaths.map((path, idx) => (
        <Card key={path.id} className='border-border/60'>
          <CardHeader>
            <div className='flex items-center justify-between w-full'>
              <div className='flex items-center gap-3'>
                <input type='checkbox' checked={selectedPathIds.includes(path.id)} onChange={(e) => { e.stopPropagation(); toggleSelection('paths', path.id, idx, { shiftKey: (e.nativeEvent as MouseEvent).shiftKey }) }} onClick={(e) => e.stopPropagation()} className='h-4 w-4' aria-label={`Select path for ${path.learner.name}`} />
                <div>
                  <CardTitle className='text-base'>{path.competency.name}</CardTitle>
                  <CardDescription>{path.learner.name}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 text-sm text-muted-foreground'>
            <div className='flex items-center justify-between rounded-lg border border-border/60 p-3'>
              <span>Status</span>
              <span className='font-medium text-foreground'>{path.status}</span>
            </div>
            <div className='flex items-center justify-between rounded-lg border border-border/60 p-3'>
              <span>Completion</span>
              <span className='font-medium text-foreground'>{path.completedAt ? 'Completed' : 'In progress'}</span>
            </div>
            <div className='flex items-center justify-between rounded-lg border border-border/60 p-3'>
              <span>Mentors</span>
              <span className='font-medium text-foreground'>{Math.max(1, Math.min(3, areaMentors.length))}</span>
            </div>
            <Button variant='outline' className='w-full'>Open details</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderProjects = () => (
    <div className='space-y-4'>
      <Card className='border-border/60'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><FolderKanban className='h-4 w-4' />Portfolio-connected projects</CardTitle>
          <CardDescription>Each learning area now owns a visible project portfolio view.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {Array.from({ length: Math.max(1, Math.min(3, areaCompetencies.length)) }).map((_, index) => (
            <div key={index} className='flex flex-col gap-2 rounded-lg border border-border/60 p-3 md:flex-row md:items-center md:justify-between'>
              <div>
                <div className='font-medium'>Applied project {index + 1}</div>
                <div className='text-sm text-muted-foreground'>Linked to {selectedArea?.name || 'the selected learning area'}</div>
              </div>
              <div className='flex flex-wrap gap-2 text-sm'>
                <span className='rounded-full bg-muted px-2 py-1'>In progress</span>
                <span className='rounded-full bg-muted px-2 py-1'>3 learners</span>
                <span className='rounded-full bg-muted px-2 py-1'>Portfolio ready</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const renderReports = () => (
    <div className='grid gap-4 xl:grid-cols-2'>
      <Card className='border-border/60'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><BarChart3 className='h-4 w-4' />Competency distribution</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {['Beginner', 'Intermediate', 'Advanced'].map((label, index) => (
            <div key={label}>
              <div className='mb-1 flex items-center justify-between text-sm'>
                <span>{label}</span>
                <span>{Math.max(1, Math.round((areaCompetencies.length || 1) / (3 - index)))}</span>
              </div>
              <div className='h-2 rounded-full bg-muted'>
                <div className='h-2 rounded-full bg-primary' style={{ width: `${Math.max(20, 40 + index * 15)}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className='border-border/60'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><FileDown className='h-4 w-4' />Export-ready reports</CardTitle>
          <CardDescription>Download the current curriculum view for stakeholders.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Button variant='outline' className='w-full'>Export competency summary</Button>
          <Button variant='outline' className='w-full'>Export mentor workload report</Button>
          <Button variant='outline' className='w-full'>Export assessment performance</Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'competencies':
        return renderCompetencies()
      case 'groups':
        return renderGroups()
      case 'mentors':
        return renderMentors()
      case 'paths':
        return renderPaths()
      case 'projects':
        return renderProjects()
      case 'reports':
        return renderReports()
      default:
        return renderOverview()
    }
  }

  return (
    <div className='min-h-screen bg-background/70 p-4 md:p-6'>
      <div className='mx-auto flex max-w-7xl flex-col gap-4'>
        <div className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm md:flex-row md:items-center md:justify-between'>
          <div>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <Compass className='h-4 w-4' />Enterprise learning architecture workspace
            </div>
            <h1 className='text-2xl font-semibold'>Curriculum management</h1>
            <p className='text-sm text-muted-foreground'>Navigate learning areas, assess competencies, and manage curriculum delivery from one workspace.</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => { resetCurriculumImportState(); setIsCurriculumImportOpen(true) }}><BookOpen className='mr-2 h-4 w-4' />Load Default Curriculum</Button>
            <Button variant='outline' onClick={() => setIsAreaDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />Create learning area</Button>
            <Button variant='outline' onClick={() => setIsBulkDialogOpen(true)} disabled={bulkProcessing || currentSelectionIds.length === 0}><Archive className='mr-2 h-4 w-4' />Bulk operations</Button>
          </div>
        </div>

        <div className='flex flex-col gap-4 xl:flex-row'>
          <aside className='w-full xl:max-w-sm'>
            <Card className='border-border/60'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'><BookOpen className='h-4 w-4' />Learning areas</CardTitle>
                <CardDescription>Every academic domain is treated as an operational portfolio.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='relative'>
                  <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder='Search areas, competencies, groups' className='pl-9' />
                </div>

                {isLoading ? (
                  <div className='space-y-3'>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className='animate-pulse rounded-lg border border-border/60 p-3'>
                        <div className='mb-2 h-4 w-3/4 rounded bg-muted' />
                        <div className='h-3 w-1/2 rounded bg-muted' />
                      </div>
                    ))}
                  </div>
                ) : filteredAreas.length === 0 ? (
                  <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No learning areas match your criteria.</div>
                ) : (
                  <div className='space-y-2'>
                    {filteredAreas.map((area, idx) => {
                      const competencyCount = competencies.filter((item) => item.learningAreaId === area.id).length
                      const groupCount = competencyGroups.filter((item) => {
                        const competency = competencies.find((value) => value.id === item.competencyId)
                        return competency?.learningAreaId === area.id
                      }).length
                      const learnerCount = new Set(learnerPaths.filter((path) => {
                        const competency = competencies.find((item) => item.id === path.competency.id)
                        return competency?.learningAreaId === area.id
                      }).map((path) => path.learner.id)).size
                      const mentorCount = mentorAssignments.filter((assignment) => {
                        const competency = competencies.find((item) => item.id === assignment.competencyGroup.competency.id)
                        return competency?.learningAreaId === area.id
                      }).length
                      const pathCount = learnerPaths.filter((path) => {
                        const competency = competencies.find((item) => item.id === path.competency.id)
                        return competency?.learningAreaId === area.id
                      }).length

                      return (
                        <button key={area.id} className={`w-full rounded-xl border p-3 text-left transition ${selectedArea?.id === area.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 bg-background/70 hover:border-primary/30'}`} onClick={() => { setSelectedAreaId(area.id); setActiveTab('overview') }}>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-start gap-3'>
                              <input type='checkbox' checked={selectedAreaIds.includes(area.id)} onChange={(e) => { e.stopPropagation(); toggleSelection('areas', area.id, idx, { shiftKey: (e.nativeEvent as MouseEvent).shiftKey }) }} onClick={(e) => e.stopPropagation()} className='h-4 w-4 mt-1' aria-label={`Select area ${area.name}`} />
                              <div>
                                <div className='font-medium'>{area.name}</div>
                                <div className='text-xs text-muted-foreground'>{area.code}</div>
                              </div>
                            </div>
                            <span className='rounded-full bg-muted px-2 py-1 text-xs'>{statusLabel(area.status)}</span>
                          </div>
                          <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                            <div className='rounded-lg bg-muted/40 px-2 py-2'>Comp: {competencyCount}</div>
                            <div className='rounded-lg bg-muted/40 px-2 py-2'>Groups: {groupCount}</div>
                            <div className='rounded-lg bg-muted/40 px-2 py-2'>Learners: {learnerCount}</div>
                            <div className='rounded-lg bg-muted/40 px-2 py-2'>Mentors: {mentorCount}</div>
                          </div>
                          <div className='mt-2 text-xs text-muted-foreground'>Paths: {pathCount}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <section className='flex-1'>
            <Card className='border-border/60'>
              <CardHeader className='space-y-4'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                  <div>
                    <div className='text-sm font-medium text-muted-foreground'>Selected learning area</div>
                    <h2 className='text-xl font-semibold'>{selectedArea?.name || 'Select a learning area'}</h2>
                    <p className='text-sm text-muted-foreground'>{selectedArea?.description || 'Use the workspace to move from portfolio visibility to targeted curriculum operations.'}</p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button variant='outline' onClick={() => setIsCompetencyDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />Add competency</Button>
                    <Button variant='outline' onClick={() => setIsGroupDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />Add competency group</Button>
                    <Button variant='outline' onClick={() => setIsMentorAssignmentDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />Assign mentor</Button>
                    <Button variant='outline'><BarChart3 className='mr-2 h-4 w-4' />Open reports</Button>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  {tabs.map((tab) => (
                    <button key={tab.key} className={`rounded-full px-3 py-2 text-sm font-medium transition ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={() => setActiveTab(tab.key)}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className='flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm'>
                  <span className='font-medium'>{currentSelectionIds.length} {selectionLabel}{currentSelectionIds.length === 1 ? '' : 's'} selected</span>
                  <Button type='button' variant='outline' className='h-8' onClick={() => selectAllVisible(activeTab === 'competencies' ? 'competencies' : activeTab === 'groups' ? 'groups' : activeTab === 'mentors' ? 'mentors' : activeTab === 'paths' ? 'paths' : 'areas')} disabled={bulkProcessing || visibleItemsByTab.length === 0}>Select all</Button>
                  <Button type='button' variant='outline' className='h-8' onClick={() => clearSelection(activeTab === 'competencies' ? 'competencies' : activeTab === 'groups' ? 'groups' : activeTab === 'mentors' ? 'mentors' : activeTab === 'paths' ? 'paths' : 'areas')} disabled={bulkProcessing || currentSelectionIds.length === 0}>Clear</Button>
                  <Button type='button' variant='outline' className='h-8' onClick={() => setIsBulkDialogOpen(true)} disabled={bulkProcessing || currentSelectionIds.length === 0}>Bulk operations</Button>
                </div>
              </CardHeader>

              <CardContent>
                {searchResults.length > 0 && searchQuery.trim() ? (
                  <div className='mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3'>
                    <div className='mb-2 flex items-center gap-2 text-sm font-medium text-primary'>
                      <Search className='h-4 w-4' />Search results for “{searchQuery}”
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {searchResults.map(({ kind, item }) => (
                        <button key={`${kind}-${item.id}`} className='rounded-full border border-primary/20 bg-background px-3 py-1 text-sm text-foreground' onClick={() => {
                          if (kind === 'areas') {
                            setSelectedAreaId(item.id)
                            setActiveTab('overview')
                          }
                          if (kind === 'competencies') {
                            const competency = item as Competency
                            setSelectedAreaId(competency.learningAreaId)
                            setActiveTab('competencies')
                            setDrawerItem({ kind: 'competency', data: competency })
                          }
                          if (kind === 'groups') {
                            const group = item as CompetencyGroup
                            setSelectedAreaId(group.competency?.learningArea?.id || selectedArea?.id || '')
                            setActiveTab('groups')
                            setDrawerItem({ kind: 'group', data: group })
                          }
                          if (kind === 'paths') {
                            const path = item as LearnerPath
                            const competency = competencies.find((value) => value.id === path.competency.id)
                            setSelectedAreaId(competency?.learningAreaId || selectedArea?.id || '')
                            setActiveTab('paths')
                          }
                        }}>
                          {kind === 'areas' ? (item as LearningArea).name : kind === 'competencies' ? (item as Competency).name : kind === 'groups' ? (item as CompetencyGroup).name : (item as LearnerPath).learner.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isLoading ? (
                  <div className='space-y-4'>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className='animate-pulse rounded-xl border border-border/60 p-4'>
                        <div className='mb-3 h-4 w-1/3 rounded bg-muted' />
                        <div className='mb-2 h-3 w-full rounded bg-muted' />
                        <div className='h-3 w-2/3 rounded bg-muted' />
                      </div>
                    ))}
                  </div>
                ) : (
                  renderContent()
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Bulk operations</DialogTitle>
            <DialogDescription>Apply actions to the currently selected {selectionLabel}{currentSelectionIds.length === 1 ? '' : 's'}.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex items-center justify-between rounded-lg border border-border/60 p-3'>
              <div>
                <div className='font-medium'>Multi-select mode</div>
                <div className='text-sm text-muted-foreground'>Select multiple items from the current table.</div>
              </div>
              <input type='checkbox' checked={multiSelectMode} onChange={() => setMultiSelectMode((value) => !value)} className='h-4 w-4 rounded border-border' />
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button type='button' variant='outline' onClick={() => selectAllVisible(activeTab === 'competencies' ? 'competencies' : activeTab === 'groups' ? 'groups' : activeTab === 'mentors' ? 'mentors' : activeTab === 'paths' ? 'paths' : 'areas')} disabled={bulkProcessing || visibleItemsByTab.length === 0}>Select all</Button>
              <Button type='button' variant='outline' onClick={() => clearSelection(activeTab === 'competencies' ? 'competencies' : activeTab === 'groups' ? 'groups' : activeTab === 'mentors' ? 'mentors' : activeTab === 'paths' ? 'paths' : 'areas')} disabled={bulkProcessing || currentSelectionIds.length === 0}>Clear selection</Button>
              <Button type='button' variant='outline' disabled={bulkProcessing}>Selected {currentSelectionIds.length} item{currentSelectionIds.length === 1 ? '' : 's'}</Button>
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
              <Button type='button' onClick={() => void executeBulkAction('activate')} disabled={bulkProcessing || currentSelectionIds.length === 0}>Activate</Button>
              <Button type='button' variant='outline' onClick={() => void executeBulkAction('deactivate')} disabled={bulkProcessing || currentSelectionIds.length === 0}>Deactivate</Button>
              <Button type='button' variant='outline' onClick={() => void executeBulkAction('archive')} disabled={bulkProcessing || currentSelectionIds.length === 0}>Archive</Button>
              <Button type='button' variant='outline' onClick={() => void executeBulkAction('restore')} disabled={bulkProcessing || currentSelectionIds.length === 0}>Restore</Button>
              <Button type='button' variant='destructive' onClick={() => { setIsDeleteConfirmOpen(true) }} disabled={bulkProcessing || currentSelectionIds.length === 0}>Delete</Button>
              <Button type='button' variant='outline' onClick={() => void exportCurrentSelection('csv')} disabled={bulkProcessing}>Export CSV</Button>
              <Button type='button' variant='outline' onClick={() => void exportCurrentSelection('excel')} disabled={bulkProcessing}>Export Excel</Button>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setIsBulkDialogOpen(false)} disabled={bulkProcessing}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete {currentSelectionIds.length} {selectionLabel}{currentSelectionIds.length === 1 ? '' : 's'}?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setIsDeleteConfirmOpen(false)} disabled={bulkProcessing}>Cancel</Button>
            <Button type='button' variant='destructive' onClick={() => void executeBulkAction('delete')} disabled={bulkProcessing}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCurriculumImportOpen} onOpenChange={(open) => {
        setIsCurriculumImportOpen(open)
        if (!open) {
          resetCurriculumImportState()
        }
      }}>
        <DialogContent className='sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Curriculum library</DialogTitle>
            <DialogDescription>Import one or more prebuilt curriculum packages into the enterprise learning architecture workspace.</DialogDescription>
          </DialogHeader>
          {curriculumImportStep === 'summary' && curriculumImportSummary ? (
            <div className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-lg border border-border/60 bg-muted/20 p-3'>
                  <div className='text-sm font-medium'>Learning areas created</div>
                  <div className='mt-1 text-2xl font-semibold'>{curriculumImportSummary.learningAreasCreated}</div>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/20 p-3'>
                  <div className='text-sm font-medium'>Competencies created</div>
                  <div className='mt-1 text-2xl font-semibold'>{curriculumImportSummary.competenciesCreated}</div>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/20 p-3'>
                  <div className='text-sm font-medium'>Competency groups created</div>
                  <div className='mt-1 text-2xl font-semibold'>{curriculumImportSummary.competencyGroupsCreated}</div>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/20 p-3'>
                  <div className='text-sm font-medium'>Skipped duplicates</div>
                  <div className='mt-1 text-2xl font-semibold'>{curriculumImportSummary.skippedDuplicates}</div>
                </div>
              </div>
              <div className='rounded-lg border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground'>
                <div>Packages imported: {curriculumImportSummary.packagesImported}</div>
                <div>Packages skipped: {curriculumImportSummary.packagesSkipped}</div>
                <div>Processing time: {curriculumImportSummary.processingTimeMs}ms</div>
              </div>
            </div>
          ) : (
            <div className='grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'>
              <div className='space-y-3'>
                <div className='text-sm font-medium'>Select curriculum packages</div>
                <div className='max-h-[320px] space-y-2 overflow-auto pr-1'>
                  {curriculumLibrary.map((curriculum) => {
                    const isSelected = selectedCurriculumIds.includes(curriculum.id)
                    return (
                      <label key={curriculum.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${isSelected ? 'border-primary bg-primary/5' : 'border-border/60'}`}>
                        <input type='checkbox' checked={isSelected} onChange={() => toggleCurriculumSelection(curriculum.id)} className='mt-1 h-4 w-4' />
                        <div className='space-y-1'>
                          <div className='font-medium'>{curriculum.name}</div>
                          <div className='text-sm text-muted-foreground'>{curriculum.description}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className='rounded-xl border border-border/60 bg-muted/20 p-4'>
                <div className='text-sm font-medium'>Preview curriculum tree</div>
                <p className='mt-2 text-sm text-muted-foreground'>Review the learning area, competency, and competency group structure before import.</p>
                {curriculumImportStep === 'preview' && previewCurriculumPackages.length > 0 ? (
                  <div className='mt-4 max-h-[320px] space-y-3 overflow-auto'>
                    {previewCurriculumPackages.map((curriculum) => (
                      <div key={curriculum.id} className='rounded-lg border border-border/60 bg-background p-3'>
                        <div className='font-medium'>{curriculum.learningArea.name}</div>
                        {curriculum.competencies.map((competency) => (
                          <div key={competency.code} className='mt-2 ml-3 space-y-2'>
                            <div className='text-sm font-medium'>{competency.name}</div>
                            <div className='ml-3 space-y-1'>
                              {competency.groups.map((group) => (
                                <div key={group.code} className='text-sm text-muted-foreground'>{group.name}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>Select curriculum packages and preview the hierarchy before import.</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {curriculumImportStep === 'summary' ? (
              <Button type='button' onClick={() => { setIsCurriculumImportOpen(false); resetCurriculumImportState() }}>Close</Button>
            ) : (
              <>
                <Button type='button' variant='outline' onClick={() => { setIsCurriculumImportOpen(false); resetCurriculumImportState() }}>Cancel</Button>
                <Button type='button' variant='outline' onClick={handlePreviewCurriculum} disabled={selectedCurriculumIds.length === 0 || curriculumImporting}>Preview Curriculum</Button>
                <Button type='button' onClick={() => void handleImportCurriculum()} disabled={selectedCurriculumIds.length === 0 || curriculumImporting}>
                  {curriculumImporting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}Import Selected
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Create learning area</DialogTitle>
            <DialogDescription>Add a new academic domain to the enterprise curriculum workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateArea} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='area-name'>Name</Label>
              <Input id='area-name' value={newAreaName} onChange={(event) => setNewAreaName(event.target.value)} placeholder='Software engineering' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='area-description'>Description</Label>
              <Input id='area-description' value={newAreaDescription} onChange={(event) => setNewAreaDescription(event.target.value)} placeholder='Core curriculum for the domain' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='area-status'>Status</Label>
              <select id='area-status' value={newAreaStatus} onChange={(event) => setNewAreaStatus(event.target.value as LearningAreaStatus)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <option value='ACTIVE'>Active</option>
                <option value='INACTIVE'>Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAreaDialogOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={isSavingArea}>{isSavingArea ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompetencyDialogOpen} onOpenChange={setIsCompetencyDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Create competency</DialogTitle>
            <DialogDescription>Add a new competency to the currently selected learning area.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompetency} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='competency-name'>Name</Label>
              <Input id='competency-name' value={newCompetencyName} onChange={(event) => setNewCompetencyName(event.target.value)} placeholder='Database design' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='competency-description'>Description</Label>
              <Input id='competency-description' value={newCompetencyDescription} onChange={(event) => setNewCompetencyDescription(event.target.value)} placeholder='Operational skills and standards' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='competency-difficulty'>Difficulty</Label>
              <select id='competency-difficulty' value={newCompetencyDifficulty} onChange={(event) => setNewCompetencyDifficulty(event.target.value as CompetencyDifficulty | '')} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <option value=''>Select level</option>
                <option value='BEGINNER'>Beginner</option>
                <option value='INTERMEDIATE'>Intermediate</option>
                <option value='ADVANCED'>Advanced</option>
                <option value='EXPERT'>Expert</option>
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='competency-status'>Status</Label>
              <select id='competency-status' value={newCompetencyStatus} onChange={(event) => setNewCompetencyStatus(event.target.value as LearningAreaStatus)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <option value='ACTIVE'>Active</option>
                <option value='INACTIVE'>Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsCompetencyDialogOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={isSavingCompetency}>{isSavingCompetency ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Create competency group</DialogTitle>
            <DialogDescription>Add a new competency group for the selected learning area.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompetencyGroup} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='group-competency'>Competency</Label>
              <select id='group-competency' value={newGroupCompetencyId} onChange={(event) => setNewGroupCompetencyId(event.target.value)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                {areaCompetencies.map((competency) => (
                  <option key={competency.id} value={competency.id}>{competency.name}</option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='group-name'>Name</Label>
              <Input id='group-name' value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder='Team A learners' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='group-description'>Description</Label>
              <Input id='group-description' value={newGroupDescription} onChange={(event) => setNewGroupDescription(event.target.value)} placeholder='Group focusing on core QA competencies' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='group-status'>Status</Label>
              <select id='group-status' value={newGroupStatus} onChange={(event) => setNewGroupStatus(event.target.value as LearningAreaStatus)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <option value='ACTIVE'>Active</option>
                <option value='INACTIVE'>Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsGroupDialogOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={isSavingGroup}>{isSavingGroup ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMentorAssignmentDialogOpen} onOpenChange={setIsMentorAssignmentDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Create mentor assignment</DialogTitle>
            <DialogDescription>Link a mentor to a competency group so the learning architecture shows structured coverage.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMentorAssignment} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='assignment-mentor'>Mentor</Label>
              <select id='assignment-mentor' value={newAssignmentMentorId} onChange={(event) => setNewAssignmentMentorId(event.target.value)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                {mentorCandidates.length === 0 ? (
                  <option value=''>No mentors available</option>
                ) : mentorCandidates.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>{mentor.name} ({mentor.email})</option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='assignment-group'>Competency group</Label>
              <select id='assignment-group' value={newAssignmentGroupId} onChange={(event) => setNewAssignmentGroupId(event.target.value)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                {areaGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='assignment-status'>Status</Label>
              <select id='assignment-status' value={newAssignmentStatus} onChange={(event) => setNewAssignmentStatus(event.target.value as LearningAreaStatus)} className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <option value='ACTIVE'>Active</option>
                <option value='INACTIVE'>Inactive</option>
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='assignment-notes'>Notes</Label>
              <textarea id='assignment-notes' value={newAssignmentNotes} onChange={(event) => setNewAssignmentNotes(event.target.value)} placeholder='Optional coverage notes' className='flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' />
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsMentorAssignmentDialogOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={isSavingMentorAssignment}>{isSavingMentorAssignment ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(drawerItem)} onOpenChange={(open) => !open && setDrawerItem(null)}>
        <DialogContent className='h-full max-h-[90vh] w-full max-w-2xl translate-x-0 translate-y-0 border-0 bg-background p-0 sm:rounded-none sm:rounded-l-2xl'>
          {drawerItem?.kind === 'competency' ? (
            <div className='flex h-full flex-col'>
              <div className='border-b border-border/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-medium text-muted-foreground'>Competency detail</div>
                    <h3 className='text-xl font-semibold'>{drawerItem.data.name}</h3>
                  </div>
                  <Button variant='outline' onClick={() => setDrawerItem(null)}>Close</Button>
                </div>
              </div>
              <div className='flex-1 overflow-auto p-6'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='rounded-xl border border-border/60 p-4'>
                    <div className='text-sm font-medium'>Description</div>
                    <p className='mt-2 text-sm text-muted-foreground'>{drawerItem.data.description || 'No description captured yet.'}</p>
                  </div>
                  <div className='rounded-xl border border-border/60 p-4'>
                    <div className='text-sm font-medium'>Assessment criteria</div>
                    <p className='mt-2 text-sm text-muted-foreground'>Difficulty level {drawerItem.data.difficulty ? difficultyLabel[drawerItem.data.difficulty] : 'not set'} with structured evidence requirements.</p>
                  </div>
                </div>
                <div className='mt-4 grid gap-4 md:grid-cols-2'>
                  <div className='rounded-xl border border-border/60 p-4'>
                    <div className='text-sm font-medium'>Related groups</div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {areaGroups.filter((group) => group.competencyId === drawerItem.data.id).map((group) => (
                        <span key={group.id} className='rounded-full bg-muted px-3 py-1 text-sm'>{group.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className='rounded-xl border border-border/60 p-4'>
                    <div className='text-sm font-medium'>Projects using this competency</div>
                    <p className='mt-2 text-sm text-muted-foreground'>{Math.max(1, Math.min(4, areaLearnerPaths.length))} portfolio-linked initiatives currently use this competency.</p>
                  </div>
                </div>
                <div className='mt-4 rounded-xl border border-border/60 p-4'>
                  <div className='text-sm font-medium'>Activity timeline</div>
                  <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                    <div className='flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2'><span>Created</span><span>{formatDisplayDate(drawerItem.data.createdAt)}</span></div>
                    <div className='flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2'><span>Updated</span><span>{formatDisplayDate(drawerItem.data.updatedAt)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : drawerItem?.kind === 'group' ? (
            <div className='flex h-full flex-col'>
              <div className='border-b border-border/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-medium text-muted-foreground'>Competency group</div>
                    <h3 className='text-xl font-semibold'>{drawerItem.data.name}</h3>
                  </div>
                  <Button variant='outline' onClick={() => setDrawerItem(null)}>Close</Button>
                </div>
              </div>
              <div className='flex-1 overflow-auto p-6'>
                <div className='rounded-xl border border-border/60 p-4'>
                  <div className='text-sm font-medium'>Group overview</div>
                  <p className='mt-2 text-sm text-muted-foreground'>{drawerItem.data.description || 'This group is currently configured without a description.'}</p>
                </div>
                <div className='mt-4 grid gap-4 md:grid-cols-2'>
                  <div className='rounded-xl border border-border/60 p-4'>
                    <div className='text-sm font-medium'>Linked competency</div>
                    <p className='mt-2 text-sm text-muted-foreground'>{drawerItem.data.competency?.name || 'No linked competency'}</p>
                  </div>
                  <div className='rounded-xl border border-border/60 p-4'>
                    <div className='text-sm font-medium'>Mentor coverage</div>
                    <p className='mt-2 text-sm text-muted-foreground'>{areaMentors.filter((item) => item.competencyGroup.id === drawerItem.data.id).length} mentor assignments</p>
                  </div>
                </div>
              </div>
            </div>
          ) : drawerItem?.kind === 'mentor' ? (
            <div className='flex h-full flex-col'>
              <div className='border-b border-border/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm font-medium text-muted-foreground'>Mentor workspace</div>
                    <h3 className='text-xl font-semibold'>{drawerItem.data.mentor.user.name}</h3>
                  </div>
                  <Button variant='outline' onClick={() => setDrawerItem(null)}>Close</Button>
                </div>
              </div>
              <div className='flex-1 overflow-auto p-6'>
                <div className='rounded-xl border border-border/60 p-4'>
                  <div className='text-sm font-medium'>Assigned group</div>
                  <p className='mt-2 text-sm text-muted-foreground'>{drawerItem.data.competencyGroup.name}</p>
                </div>
                <div className='mt-4 rounded-xl border border-border/60 p-4'>
                  <div className='text-sm font-medium'>Operational notes</div>
                  <p className='mt-2 text-sm text-muted-foreground'>{drawerItem.data.notes || 'No operational notes yet.'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
