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
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Calendar,
  User,
  FileText
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { LogStatus } from "@/types"

// Mock data - replace with actual API call
const pendingEntries = [
  {
    id: "1",
    studentName: "John Doe",
    studentEmail: "john.doe@university.edu",
    title: "Database Schema Design",
    description: "Designed and implemented complete database schema for user management system",
    date: new Date("2024-01-15"),
    submittedAt: new Date("2024-01-15T10:30:00"),
    status: LogStatus.PENDING,
    activities: "Created ER diagrams, implemented tables, set up relationships"
  },
  {
    id: "2",
    studentName: "Jane Smith",
    studentEmail: "jane.smith@university.edu", 
    title: "API Development",
    description: "Created RESTful APIs for logbook CRUD operations",
    date: new Date("2024-01-14"),
    submittedAt: new Date("2024-01-14T14:15:00"),
    status: LogStatus.PENDING,
    activities: "Implemented endpoints, added validation, wrote documentation"
  },
  {
    id: "3",
    studentName: "Mike Johnson",
    studentEmail: "mike.johnson@university.edu",
    title: "Frontend Components",
    description: "Built reusable UI components using React and Tailwind CSS",
    date: new Date("2024-01-13"),
    submittedAt: new Date("2024-01-13T09:45:00"),
    status: LogStatus.PENDING,
    activities: "Created buttons, cards, forms, and layout components"
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

export default function ReviewPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  const filteredEntries = pendingEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleQuickApprove = async (entryId: string) => {
    // TODO: Implement API call to approve entry
    console.log("Quick approving entry:", entryId)
  }

  const handleQuickReject = async (entryId: string) => {
    // TODO: Implement API call to reject entry
    console.log("Quick rejecting entry:", entryId)
  }

  return (
    <DashboardLayout title="Review Logbook Entries">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Review Entries</h2>
            <p className="text-muted-foreground">Review and approve student logbook submissions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {filteredEntries.length} Pending
            </Badge>
          </div>
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
                    placeholder="Search by student, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Entries</CardTitle>
                <CardDescription>
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} awaiting review
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow 
                        key={entry.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedEntry === entry.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedEntry(entry.id)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.studentName}</div>
                            <div className="text-sm text-muted-foreground">{entry.studentEmail}</div>
                          </div>
                        </TableCell>
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/supervisor/review/${entry.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Review Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleQuickApprove(entry.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Quick Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleQuickReject(entry.id)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Quick Reject
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

          {/* Entry Details Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Entry Preview</CardTitle>
                <CardDescription>
                  {selectedEntry ? "Selected entry details" : "Select an entry to preview"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEntry ? (
                  <div className="space-y-4">
                    {(() => {
                      const entry = pendingEntries.find(e => e.id === selectedEntry)
                      if (!entry) return null
                      
                      return (
                        <>
                          <div>
                            <h4 className="font-semibold">{entry.title}</h4>
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm mb-2">Student</h5>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{entry.studentName}</span>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-sm mb-2">Activities</h5>
                            <p className="text-sm text-muted-foreground">{entry.activities}</p>
                          </div>

                          <div>
                            <h5 className="font-medium text-sm mb-2">Submitted</h5>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(entry.submittedAt)}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <Link href={`/supervisor/review/${entry.id}`}>
                              <Button size="sm" className="flex-1">
                                <Eye className="mr-2 h-4 w-4" />
                                Full Review
                              </Button>
                            </Link>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Click on an entry to preview details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
