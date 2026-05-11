"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar,
  Award,
  Activity,
  MapPin,
  ChevronDown,
  Filter
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"

export default function AdminAttendancePage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod, selectedDepartment])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        department: selectedDepartment
      })
      
      const response = await fetch(`/api/attendance/analytics?${params}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Attendance Analytics">
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
      </DashboardLayout>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <DashboardLayout title="Attendance Analytics">
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Attendance Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive overview of attendance patterns and statistics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button className="gap-2">
              <Calendar className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Period and Department Filters */}
        <div className="flex gap-4">
          <div className="flex gap-2">
            {['day', 'week', 'month', 'year'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Departments</option>
            <option value="cs">Computer Science</option>
            <option value="it">Information Technology</option>
            <option value="eng">Engineering</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.overview?.totalRecords || 0}</div>
              <p className="text-xs text-muted-foreground">
                All attendance records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.overview?.activeSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently checked in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics?.overview?.completionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Sessions completed
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
                {analytics?.overview?.totalHours || 0}h
              </div>
              <p className="text-xs text-muted-foreground">
                Hours worked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Attendance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trends</CardTitle>
              <CardDescription>
                Number of attendance records per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.dailyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="recordsCount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Students with highest attendance hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topStudents?.slice(0, 5).map((student: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {student.rank}
                      </div>
                      <div>
                        <div className="font-medium">{student.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.department}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{student.totalHours}h</div>
                      <div className="text-xs text-muted-foreground">
                        {student.sessionsCount} sessions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Office Locations
              </CardTitle>
              <CardDescription>
                Attendance by location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">NYX Office Main</span>
                  <Badge variant="outline">156</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">NYX Office Annex</span>
                  <Badge variant="outline">89</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Remote Work</span>
                  <Badge variant="outline">23</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Pattern
              </CardTitle>
              <CardDescription>
                Attendance by day of week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Monday', value: 45 },
                      { name: 'Tuesday', value: 52 },
                      { name: 'Wednesday', value: 48 },
                      { name: 'Thursday', value: 50 },
                      { name: 'Friday', value: 38 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[45, 52, 48, 50, 38].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Manage Locations
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
