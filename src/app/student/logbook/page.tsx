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
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  FileText
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { LogStatus } from "@/types"

// Mock data - replace with actual API call
const logbookEntries = [
  {
    id: "1",
    title: "Database Schema Design",
    description: "Designed and implemented the complete database schema for the user management system",
    date: new Date("2024-01-15"),
    status: LogStatus.APPROVED,
    supervisorComments: 2
  },
  {
    id: "2", 
    title: "API Development",
    description: "Created RESTful APIs for logbook CRUD operations",
    date: new Date("2024-01-14"),
    status: LogStatus.PENDING,
    supervisorComments: 1
  },
  {
    id: "3",
    title: "Frontend Components",
    description: "Built reusable UI components using React and Tailwind CSS",
    date: new Date("2024-01-13"),
    status: LogStatus.DRAFT,
    supervisorComments: 0
  },
  {
    id: "4",
    title: "Authentication System",
    description: "Implemented JWT-based authentication with NextAuth",
    date: new Date("2024-01-12"),
    status: LogStatus.APPROVED,
    supervisorComments: 3
  },
  {
    id: "5",
    title: "Testing Framework Setup",
    description: "Set up Jest and React Testing Library for unit testing",
    date: new Date("2024-01-11"),
    status: LogStatus.REJECTED,
    supervisorComments: 1
  }
]

const statusColors = {
  [LogStatus.APPROVED]: "bg-green-100 text-green-800",
  [LogStatus.PENDING]: "bg-yellow-100 text-yellow-800", 
  [LogStatus.REJECTED]: "bg-red-100 text-red-800",
  [LogStatus.DRAFT]: "bg-gray-100 text-gray-800"
}

const statusLabels = {
  [LogStatus.APPROVED]: "Approved",
  [LogStatus.PENDING]: "Pending Review",
  [LogStatus.REJECTED]: "Rejected",
  [LogStatus.DRAFT]: "Draft"
}

export default function LogbookPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<LogStatus | "all">("all")

  const filteredEntries = logbookEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || entry.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <DashboardLayout title="Logbook Entries">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Logbook Entries</h2>
            <p className="text-muted-foreground">Manage your internship daily and weekly logs</p>
          </div>
          <Link href="/student/logbook/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logbookEntries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {logbookEntries.filter(e => e.status === LogStatus.APPROVED).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {logbookEntries.filter(e => e.status === LogStatus.PENDING).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {logbookEntries.filter(e => e.status === LogStatus.DRAFT).length}
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
                    placeholder="Search entries..."
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
                  <DropdownMenuItem onClick={() => setFilterStatus(LogStatus.APPROVED)}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(LogStatus.PENDING)}>
                    Pending Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(LogStatus.REJECTED)}>
                    Rejected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(LogStatus.DRAFT)}>
                    Draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
            <CardDescription>
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {entry.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(entry.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[entry.status]}>
                        {statusLabels[entry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{entry.supervisorComments}</span>
                        {entry.supervisorComments > 0 && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
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
                            <Link href={`/student/logbook/${entry.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {entry.status === LogStatus.DRAFT && (
                            <DropdownMenuItem asChild>
                              <Link href={`/student/logbook/${entry.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
