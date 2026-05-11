"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Archive
} from "lucide-react"
import { format } from "date-fns"

interface AttendanceRecord {
  id: string
  checkInTime: string
  checkOutTime?: string
  hoursWorked?: number
  status: string
  officeLocation: {
    name: string
    address: string
  }
}

export function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalHours: 0,
    completedDays: 0,
    totalRecords: 0
  })

  useEffect(() => {
    fetchAttendanceHistory()
  }, [currentPage])

  const fetchAttendanceHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/attendance/history?page=${currentPage}&limit=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle error responses
      if (data.error) {
        console.error('API Error:', data.error)
        setRecords([])
        setTotalPages(1)
        setStats({
          totalHours: 0,
          completedDays: 0,
          totalRecords: 0
        })
        return
      }
      
      // Safely handle missing data with fallbacks
      setRecords(data.records ?? [])
      setTotalPages(data.pagination?.pages ?? 1)
      setStats(data.stats ?? {
        totalHours: 0,
        completedDays: 0,
        totalRecords: 0
      })
    } catch (error) {
      console.error('Error fetching attendance history:', error)
      // Set safe defaults on error
      setRecords([])
      setTotalPages(1)
      setStats({
        totalHours: 0,
        completedDays: 0,
        totalRecords: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-600">Completed</Badge>
      case 'ACTIVE':
        return <Badge className="bg-blue-600">Active</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDuration = (hours?: number) => {
    if (!hours) return 'N/A'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  if (loading && currentPage === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Attendance History
            </CardTitle>
            <CardDescription>Your recent attendance records</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Records */}
          {records.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance records found</p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(record.checkInTime), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatDuration(record.hoursWorked)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Check-in:</span>
                      <span>{format(new Date(record.checkInTime), 'HH:mm')}</span>
                    </div>
                    {record.checkOutTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Check-out:</span>
                        <span>{format(new Date(record.checkOutTime), 'HH:mm')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{record.officeLocation.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.officeLocation.address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-medium">{stats.totalHours}h</div>
                <div className="text-xs text-muted-foreground">Total Hours</div>
              </div>
              <div>
                <div className="font-medium">{stats.completedDays}</div>
                <div className="text-xs text-muted-foreground">Completed Days</div>
              </div>
              <div>
                <div className="font-medium">{stats.totalRecords}</div>
                <div className="text-xs text-muted-foreground">Total Records</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
