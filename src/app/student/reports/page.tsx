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

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [filterType, setFilterType] = useState<"all" | "weekly" | "monthly" | "full">("all")

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
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "draft" | "generating">("all")

  const filteredReports = reports.filter((report: any) => {
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
                {reports.filter((r: any) => r.type === "weekly").length}
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
                {reports.filter((r: any) => r.type === "monthly").length}
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
                {reports.filter((r: any) => r.type === "full").length}
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
            <div className="space-y-4">
              {filteredReports.map((report: any) => (
                <div key={(report as any).id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{(report as any).title}</h3>
                      <Badge variant={(report as any).status === 'completed' ? 'default' : 'secondary'}>
                        {(report as any).status === 'completed' ? 'Completed' : (report as any).status === 'draft' ? 'Draft' : 'Generating'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {formatDate((report as any).startDate)} - {formatDate((report as any).endDate)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {(report as any).entriesCount} entries
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">
                      {(report as any).generatedAt ? formatDate((report as any).generatedAt) : 'Not generated'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Generated {(report as any).generatedAt ? `${Math.round((Date.now() - (report as any).generatedAt.getTime()) / (1000 * 60 * 60 * 24))} days ago` : '-'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/reports/${(report as any).id}/download`, '_blank')}
                      disabled={(report as any).status !== 'completed'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open((report as any).fileUrl, '_blank')}
                      disabled={!(report as any).fileUrl}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/reports/${(report as any).id}/regenerate`, '_blank')}
                      disabled={(report as any).status === 'generating'}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
