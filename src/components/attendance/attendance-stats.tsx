"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Activity
} from "lucide-react"

export function AttendanceStats() {
  const [stats, setStats] = useState({
    totalHours: 0,
    averageHours: 0,
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    overtimeHours: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/attendance/analytics')
      if (response.ok) {
        const data = await response.json()
        
        // Use student-specific data if available, otherwise fall back to overview data
        if (data.studentStats) {
          setStats({
            totalHours: data.studentStats.totalHours || 0,
            averageHours: data.studentStats.averageHours || 0,
            totalDays: data.studentStats.totalDays || 0,
            presentDays: data.studentStats.presentDays || 0,
            absentDays: data.studentStats.absentDays || 0,
            lateDays: data.studentStats.lateDays || 0,
            overtimeHours: data.studentStats.overtimeHours || 0,
            attendanceRate: data.studentStats.attendanceRate || 0
          })
        } else {
          setStats({
            totalHours: data.overview?.totalHours || 0,
            averageHours: data.overview?.averageHours || 0,
            totalDays: data.overview?.totalDays || 0,
            presentDays: data.overview?.presentDays || 0,
            absentDays: data.overview?.absentDays || 0,
            lateDays: data.overview?.lateDays || 0,
            overtimeHours: data.overview?.overtimeHours || 0,
            attendanceRate: data.overview?.attendanceRate || 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
      setStats({
        totalHours: 0,
        averageHours: 0,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        overtimeHours: 0,
        attendanceRate: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageHours}h</div>
          <p className="text-xs text-muted-foreground">
            Per day
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.presentDays}</div>
          <p className="text-xs text-muted-foreground">
            Out of {stats.totalDays} days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
          <p className="text-xs text-muted-foreground">
            <Badge className={stats.attendanceRate >= 90 ? 'bg-green-600' : 'bg-yellow-600'}>
              {stats.attendanceRate >= 90 ? 'Excellent' : 'Good'}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overtime</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.overtimeHours}h</div>
          <p className="text-xs text-muted-foreground">
            Extra hours worked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late Days</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.lateDays}</div>
          <p className="text-xs text-muted-foreground">
            Late check-ins
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.absentDays}</div>
          <p className="text-xs text-muted-foreground">
            No attendance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5</div>
          <p className="text-xs text-muted-foreground">
            Days present
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
