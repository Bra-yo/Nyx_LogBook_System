"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface StudentProfile {
  id: string;
  regNumber: string;
  year: number;
  semester: number;
  internshipCompany?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  supervisor?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    title?: string;
    company?: string;
  };
  lecturer?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    title?: string;
    office?: string;
  };
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    internshipCompany: "",
    internshipStartDate: "",
    internshipEndDate: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/student/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.student);
        setFormData({
          internshipCompany: data.student.internshipCompany || "",
          internshipStartDate: data.student.internshipStartDate
            ? new Date(data.student.internshipStartDate)
                .toISOString()
                .split("T")[0]
            : "",
          internshipEndDate: data.student.internshipEndDate
            ? new Date(data.student.internshipEndDate)
                .toISOString()
                .split("T")[0]
            : "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internshipCompany: formData.internshipCompany || undefined,
          internshipStartDate: formData.internshipStartDate || undefined,
          internshipEndDate: formData.internshipEndDate || undefined,
        }),
      });

      if (response.ok) {
        await fetchProfile();
        setEditing(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        internshipCompany: profile.internshipCompany || "",
        internshipStartDate: profile.internshipStartDate
          ? new Date(profile.internshipStartDate).toISOString().split("T")[0]
          : "",
        internshipEndDate: profile.internshipEndDate
          ? new Date(profile.internshipEndDate).toISOString().split("T")[0]
          : "",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-56 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-24 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Unable to load your profile right now.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Student Profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage your student information and academic details
            </p>
          </div>
          <Button onClick={() => (editing ? handleSave() : setEditing(true))}>
            {editing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-start">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-primary">
              {profile.user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.user.avatar}
                  alt={profile.user.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <User className="h-16 w-16" />
              )}
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-2xl font-semibold">{profile.user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.regNumber} • Year {profile.year}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{profile.department.name}</Badge>
                <Badge variant="outline">{profile.department.code}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.user.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <div className="mt-1 text-sm">{profile.user.name}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <div className="mt-1 text-sm">{profile.user.email}</div>
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
            <div className="grid gap-4 md:grid-cols-3">
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
              <div>
                <Label className="text-sm font-medium">Department Code</Label>
                <div className="mt-1">
                  <Badge>{profile.department.code}</Badge>
                </div>
              </div>
            </div>

            {profile.supervisor && (
              <div className="rounded-lg border p-4">
                <Label className="text-sm font-medium">
                  Assigned Supervisor
                </Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">{profile.supervisor.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.supervisor.user.email}
                  </p>
                  {profile.supervisor.title && (
                    <p className="text-xs text-muted-foreground">
                      {profile.supervisor.title}
                    </p>
                  )}
                </div>
              </div>
            )}

            {profile.lecturer && (
              <div className="rounded-lg border p-4">
                <Label className="text-sm font-medium">Assigned Lecturer</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">{profile.lecturer.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.lecturer.user.email}
                  </p>
                  {profile.lecturer.title && (
                    <p className="text-xs text-muted-foreground">
                      {profile.lecturer.title}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Internship Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Internship Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="internshipCompany">Company Name</Label>
                  <Input
                    id="internshipCompany"
                    value={formData.internshipCompany}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        internshipCompany: e.target.value,
                      }))
                    }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          internshipStartDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="internshipEndDate">End Date</Label>
                    <Input
                      id="internshipEndDate"
                      type="date"
                      value={formData.internshipEndDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          internshipEndDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <div className="mt-1">
                    {formData.internshipCompany ? (
                      <Badge variant="outline">
                        {formData.internshipCompany}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <div className="mt-1">
                    {formData.internshipStartDate ? (
                      <span>
                        {new Date(
                          formData.internshipStartDate,
                        ).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <div className="mt-1">
                    {formData.internshipEndDate ? (
                      <span>
                        {new Date(
                          formData.internshipEndDate,
                        ).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Controls */}
        {editing && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
