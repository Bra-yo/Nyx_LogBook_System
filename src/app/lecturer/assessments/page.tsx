"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Calendar,
  User,
  GraduationCap,
  Star
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { AssessmentStatus } from "@/types"

// Mock data - replace with actual API call
const assessments = [
  {
    id: "1",
    studentName: "John Doe",
    studentEmail: "john.doe@university.edu",
    entryTitle: "Database Schema Design",
    date: new Date("2024-01-15"),
    status: AssessmentStatus.NOT_ASSESSED,
    technicalScore: null,
    communicationScore: null,
    professionalismScore: null,
    overallScore: null
  },
  {
    id: "2",
    studentName: "Jane Smith",
    studentEmail: "jane.smith@university.edu",
    entryTitle: "API Development",
    date: new Date("2024-01-14"),
    status: AssessmentStatus.IN_PROGRESS,
    technicalScore: 85,
    communicationScore: 90,
    professionalismScore: 88,
    overallScore: null
  },
  {
    id: "3",
    studentName: "Mike Johnson",
    studentEmail: "mike.johnson@university.edu",
    entryTitle: "Frontend Components",
    date: new Date("2024-01-13"),
    status: AssessmentStatus.COMPLETED,
    technicalScore: 92,
    communicationScore: 88,
    professionalismScore: 90,
    overallScore: 90
  }
]

const statusColors = {
  [AssessmentStatus.NOT_ASSESSED]: "bg-gray-100 text-gray-800",
  [AssessmentStatus.IN_PROGRESS]: "bg-yellow-100 text-yellow-800", 
  [AssessmentStatus.COMPLETED]: "bg-green-100 text-green-800"
}

const statusLabels = {
  [AssessmentStatus.NOT_ASSESSED]: "Not Assessed",
  [AssessmentStatus.IN_PROGRESS]: "In Progress",
  [AssessmentStatus.COMPLETED]: "Completed"
}

export default function AssessmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<AssessmentStatus | "all">("all")

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.entryTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || assessment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500"
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <DashboardLayout title="Student Assessments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Assessments</h2>
            <p className="text-muted-foreground">Evaluate and grade student logbook entries</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {filteredAssessments.length} Total
            </Badge>
            <Badge variant="destructive" className="text-sm">
              {assessments.filter(a => a.status === AssessmentStatus.NOT_ASSESSED).length} Pending
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Assessed</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {assessments.filter(a => a.status === AssessmentStatus.NOT_ASSESSED).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {assessments.filter(a => a.status === AssessmentStatus.IN_PROGRESS).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student or entry title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {filterStatus === "all" ? "All Status" : statusLabels[filterStatus]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterStatus(AssessmentStatus.NOT_ASSESSED)}>
                    Not Assessed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(AssessmentStatus.IN_PROGRESS)}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(AssessmentStatus.COMPLETED)}>
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
            <CardDescription>
              {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assessment.studentName}</div>
                        <div className="text-sm text-muted-foreground">{assessment.studentEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assessment.entryTitle}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(assessment.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[assessment.status]}>
                        {statusLabels[assessment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-medium ${getScoreColor(assessment.technicalScore)}`}>
                            {assessment.technicalScore ?? '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-medium ${getScoreColor(assessment.communicationScore)}`}>
                            {assessment.communicationScore ?? '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-medium ${getScoreColor(assessment.professionalismScore)}`}>
                            {assessment.professionalismScore ?? '-'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/lecturer/assessments/${assessment.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/lecturer/assessments/${assessment.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              {assessment.status === AssessmentStatus.NOT_ASSESSED ? 'Start Assessment' : 'Edit Assessment'}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
