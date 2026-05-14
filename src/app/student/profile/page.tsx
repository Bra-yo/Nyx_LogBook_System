"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X
} from "lucide-react"
import { useState, useEffect } from "react"

interface StudentProfile {
  id: string
  regNumber: string
  year: number
  semester: number
  internshipCompany?: string
  internshipStartDate?: string
  internshipEndDate?: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  department: {
    id: string
    name: string
    code: string
  }
  supervisor?: {
    id: string
    user: {
      name: string
      email: string
    }
    title?: string
    company?: string
  }
  lecturer?: {
    id: string
    user: {
      name: string
      email: string
    }
    title?: string
    office?: string
  }
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    internshipCompany: '',
    internshipStartDate: '',
    internshipEndDate: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/student/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.student)
        setFormData({
          internshipCompany: data.student.internshipCompany || '',
          internshipStartDate: data.student.internshipStartDate ? 
            new Date(data.student.internshipStartDate).toISOString().split('T')[0] : '',
          internshipEndDate: data.student.internshipEndDate ? 
            new Date(data.student.internshipEndDate).toISOString().split('T')[0] : ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.student)
        setEditing(false)
      } else {
        console.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setFormData({
        internshipCompany: profile.internshipCompany || '',
        internshipStartDate: profile.internshipStartDate ? 
          new Date(profile.internshipStartDate).toISOString().split('T')[0] : '',
        internshipEndDate: profile.internshipEndDate ? 
          new Date(profile.internshipEndDate).toISOString().split('T')[0] : ''
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profile">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Profile not found</h3>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Learner Profile</h2>
            <p className="text-muted-foreground">Your academic and internship information</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Information */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.user.name}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.user.email}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Registration Number</Label>
                <div className="mt-1">
                  <Badge variant="outline">{profile.regNumber}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <div className="mt-1">
                  <Badge>{profile.department.name}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>Your academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Year</Label>
                <div className="mt-1">
                  <Badge variant="outline">Year {profile.year}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Current Semester</Label>
                <div className="mt-1">
                  <Badge variant="outline">Semester {profile.semester}</Badge>
                </div>
              </div>
              {profile.supervisor && (
                <div>
                  <Label className="text-sm font-medium">Supervisor</Label>
                  <div className="mt-1">
                    <div className="text-sm">{profile.supervisor.user.name}</div>
                    <div className="text-xs text-muted-foreground">{profile.supervisor.user.email}</div>
                    {profile.supervisor.title && (
                      <div className="text-xs text-muted-foreground">{profile.supervisor.title}</div>
                    )}
                  </div>
                </div>
              )}
              {profile.lecturer && (
                <div>
                  <Label className="text-sm font-medium">Lecturer</Label>
                  <div className="mt-1">
                    <div className="text-sm">{profile.lecturer.user.name}</div>
                    <div className="text-xs text-muted-foreground">{profile.lecturer.user.email}</div>
                    {profile.lecturer.title && (
                      <div className="text-xs text-muted-foreground">{profile.lecturer.title}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Internship Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Internship Information
            </CardTitle>
            <CardDescription>Your internship placement details</CardDescription>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="internshipCompany">Company Name</Label>
                  <Input
                    id="internshipCompany"
                    value={formData.internshipCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, internshipCompany: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="internshipStartDate">Start Date</Label>
                    <Input
                      id="internshipStartDate"
                      type="date"
                      value={formData.internshipStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, internshipStartDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="internshipEndDate">End Date</Label>
                    <Input
                      id="internshipEndDate"
                      type="date"
                      value={formData.internshipEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, internshipEndDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-sm font-medium">Company</Label>
                    <div className="mt-1">
                      {profile.internshipCompany ? (
                        <Badge variant="outline">{profile.internshipCompany}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <div className="mt-1">
                      {profile.internshipStartDate ? (
                        <span>{new Date(profile.internshipStartDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <div className="mt-1">
                      {profile.internshipEndDate ? (
                        <span>{new Date(profile.internshipEndDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
