"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Search, 
  Mail,
  Building,
  Calendar,
  MapPin,
  BookOpen
} from "lucide-react"

interface Student {
  id: string
  regNumber: string
  year: number
  semester: number
  internshipCompany?: string
  internshipStartDate?: string
  internshipEndDate?: string
  user: {
    name: string
    email: string
  }
  department?: {
    name: string
    code: string
  }
  supervisor?: {
    user: {
      name: string
    }
  }
  lecturer?: {
    user: {
      name: string
    }
  }
  _count: {
    logbookEntries: number
    attendanceRecords: number
  }
}

export default function LecturerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (students.length > 0) {
      const filtered = students.filter(student =>
        student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [searchTerm, students])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/lecturer/students?limit=100')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('Failed to fetch students:', response.status)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Students">
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Students">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Students</h2>
            <p className="text-muted-foreground">
              View and manage learner profiles assigned to you
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {filteredStudents.length} Students
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name, email, registration number, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {students.length === 0 ? "No students found" : "No students match your search"}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0 
                  ? "No students are currently registered in the system."
                  : "Try adjusting your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{student.user.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {student.regNumber}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{student.user.email}</span>
                  </div>

                  {/* Department */}
                  {student.department && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{student.department.name} ({student.department.code})</span>
                    </div>
                  )}

                  {/* Academic Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>Year {student.year}, Semester {student.semester}</span>
                  </div>

                  {/* Internship Info */}
                  {student.internshipCompany && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{student.internshipCompany}</span>
                    </div>
                  )}

                  {/* Internship Dates */}
                  {student.internshipStartDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(student.internshipStartDate).toLocaleDateString()} - 
                        {student.internshipEndDate 
                          ? new Date(student.internshipEndDate).toLocaleDateString()
                          : 'Present'
                        }
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">
                        {student._count.logbookEntries}
                      </div>
                      <div className="text-xs text-muted-foreground">Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">
                        {student._count.attendanceRecords}
                      </div>
                      <div className="text-xs text-muted-foreground">Attendance</div>
                    </div>
                  </div>

                  {/* Supervisor Info */}
                  {student.supervisor && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <strong>Supervisor:</strong> {student.supervisor.user.name}
                    </div>
                  )}

                  {/* Lecturer Info */}
                  {student.lecturer && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Lecturer:</strong> {student.lecturer.user.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
