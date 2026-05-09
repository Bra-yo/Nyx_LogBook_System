"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  MoreHorizontal,
  Eye,
  FileDown,
  Printer
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { LogStatus } from "@/types"

// Mock data - replace with actual API call
const reports = [
  {
    id: "1",
    title: "Weekly Report - Week 3",
    type: "weekly",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-01-21"),
    entriesCount: 5,
    status: "completed",
    generatedAt: new Date("2024-01-22T10:30:00"),
    fileUrl: "/reports/weekly-report-3.pdf"
  },
  {
    id: "2",
    title: "Monthly Report - January 2024",
    type: "monthly",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    entriesCount: 22,
    status: "completed",
    generatedAt: new Date("2024-02-01T09:15:00"),
    fileUrl: "/reports/monthly-report-jan-2024.pdf"
  },
  {
    id: "3",
    title: "Full Internship Report",
    type: "full",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-04-30"),
    entriesCount: 89,
    status: "draft",
    generatedAt: null,
    fileUrl: null
  }
]

const statusColors = {
  completed: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
  generating: "bg-yellow-100 text-yellow-800"
}

const statusLabels = {
  completed: "Completed",
  draft: "Draft",
  generating: "Generating..."
}

const typeLabels = {
  weekly: "Weekly",
  monthly: "Monthly", 
  full: "Full Internship"
}

export default function ReportsPage() {
  const [filterType, setFilterType] = useState<"all" | "weekly" | "monthly" | "full">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "draft" | "generating">("all")

  const filteredReports = reports.filter(report => {
    const matchesType = filterType === "all" || report.type === filterType
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    return matchesType && matchesStatus
  })

  const handleGenerateReport = async (type: "weekly" | "monthly" | "full") => {
    // TODO: Implement API call to generate report
    console.log("Generating report:", type)
  }

  const handleDownloadReport = (reportId: string, fileUrl: string) => {
    // TODO: Implement file download
    console.log("Downloading report:", reportId, fileUrl)
  }

  const handlePrintReport = (reportId: string) => {
    // TODO: Implement print functionality
    console.log("Printing report:", reportId)
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Internship Reports</h2>
            <p className="text-muted-foreground">Generate and download your internship reports</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => handleGenerateReport("weekly")}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Weekly
            </Button>
            <Button onClick={() => handleGenerateReport("monthly")}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Monthly
            </Button>
            <Button onClick={() => handleGenerateReport("full")}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Full Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                Generated reports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Reports</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reports.filter(r => r.type === "weekly").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Weekly summaries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Reports</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.type === "monthly").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly summaries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Full Reports</CardTitle>
              <FileDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {reports.filter(r => r.type === "full").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Complete internship
              </p>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {filterType === "all" ? "All Types" : typeLabels[filterType]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType("all")}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterType("weekly")}>
                    Weekly
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("monthly")}>
                    Monthly
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("full")}>
                    Full Internship
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("draft")}>
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("generating")}>
                    Generating
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>
              {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[report.type as keyof typeof typeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{report.entriesCount} entries</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                        {statusLabels[report.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {report.generatedAt ? formatDate(report.generatedAt) : "Not generated"}
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
                            <Link href={`/student/reports/${report.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {report.status === "completed" && report.fileUrl && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadReport(report.id, report.fileUrl!)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handlePrintReport(report.id)}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>
                            </>
                          )}
                          {report.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleGenerateReport(report.type as any)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Report
                            </DropdownMenuItem>
                          )}
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
