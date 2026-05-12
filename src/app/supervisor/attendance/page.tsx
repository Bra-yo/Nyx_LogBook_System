"use client"

import { useState, useEffect } from "react"
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
  MoreHorizontal,
  Calendar,
  MapPin,
  Clock,
  Users,
  Loader2
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AttendanceRecord {
  id: string
  student: {
    user: { name: string; email: string }
    regNumber: string
  }
  officeLocation: {
    name: string
    address: string
  }
  checkInTime: string
  checkOutTime?: string
  hoursWorked?: number
  status: 'ACTIVE' | 'COMPLETED'
}

export default function SupervisorAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'COMPLETED'>("all")

  useEffect(() => {
    fetchAttendanceRecords()
  }, [searchTerm, filterStatus])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      })

      const response = await fetch(`/api/supervisor/attendance?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800"
  }

  const statusLabels = {
    ACTIVE: "Active",
    COMPLETED: "Completed"
  }

  return (
    <DashboardLayout title="Attendance Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Attendance</h2>
            <p className="text-muted-foreground">
              Monitor attendance of all students
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : records.length}</div>
              <p className="text-xs text-muted-foreground">
                All students' attendance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : records.filter(r => r.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently checked in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : records.filter(r => r.status === 'COMPLETED' && 
                  new Date(r.checkInTime).toDateString() === new Date().toDateString()).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sessions completed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Hours worked this period
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
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, email, or registration..."
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
                  <DropdownMenuItem onClick={() => setFilterStatus("ACTIVE")}>
                    Active Sessions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("COMPLETED")}>
                    Completed Sessions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance Records</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${records.length} ${records.length === 1 ? 'record' : 'records'} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for any students
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.student.user.name}</div>
                          <div className="text-sm text-muted-foreground">{record.student.regNumber}</div>
                          <div className="text-xs text-muted-foreground">{record.student.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{record.officeLocation.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(record.checkInTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.checkOutTime ? formatDate(record.checkOutTime) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[record.status]}>
                          {statusLabels[record.status]}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
