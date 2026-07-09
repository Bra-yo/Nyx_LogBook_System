"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  UserCircle2,
  Save,
  Edit3,
} from "lucide-react";

interface WorkerProfileData {
  id: string;
  erpEmployeeId?: string | null;
  staffNumber?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  employmentStatus?: string | null;
  nationalId?: string | null;
  dateEmployed?: string | null;
  gender?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function WorkerProfilePage() {
  const [profile, setProfile] = useState<WorkerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    department: "",
    jobTitle: "",
    employmentStatus: "",
  });

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/worker/profile");
      const data = await response.json();
      if (response.ok) {
        setProfile(data.worker);
        setFormData({
          phoneNumber: data.worker?.phoneNumber || "",
          department: data.worker?.department || "",
          jobTitle: data.worker?.jobTitle || "",
          employmentStatus: data.worker?.employmentStatus || "",
        });
      }
    } catch (err) {
      console.error("Failed to load worker profile", err);
      setError("Unable to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/worker/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.worker);
        setSuccess("Profile updated successfully.");
        setEditing(false);
      } else {
        setError(data.error || "Unable to update profile.");
      }
    } catch (err) {
      console.error("Failed to update worker profile", err);
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    profile?.fullName ||
    [profile?.firstName, profile?.middleName, profile?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Worker";

  return (
    <DashboardLayout title="Worker Profile">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Worker account profile</h2>
            <p className="text-sm text-muted-foreground">
              View and maintain your current employment details and contact
              information.
            </p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit profile
            </Button>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="rounded-lg border p-8 text-sm text-muted-foreground">
            Loading profile details...
          </div>
        ) : !profile ? (
          <div className="rounded-lg border p-8 text-sm text-muted-foreground">
            No worker profile found yet. Your account details will appear after
            synchronization.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5" />
                  Personal information
                </CardTitle>
                <CardDescription>
                  Primary profile information available for this worker.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Full name</p>
                    <p className="text-sm text-muted-foreground">
                      {displayName}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {profile.employmentStatus || "Active"}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {profile.email || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {profile.phoneNumber || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Employee ID</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.erpEmployeeId ||
                        profile.staffNumber ||
                        "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">National ID</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.nationalId || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {profile.department || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Job title</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {profile.jobTitle || "Not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile details</CardTitle>
                <CardDescription>
                  Update the contact and employment fields that are available to
                  this account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone number</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            phoneNumber: event.target.value,
                          })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            department: event.target.value,
                          })
                        }
                        placeholder="Enter department"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job title</Label>
                      <Input
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            jobTitle: event.target.value,
                          })
                        }
                        placeholder="Enter job title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">
                        Employment status
                      </Label>
                      <Input
                        id="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            employmentStatus: event.target.value,
                          })
                        }
                        placeholder="Enter employment status"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Saving..." : "Save changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 rounded-lg border p-4 text-sm text-muted-foreground">
                    <p>Contact and employment details can be updated here.</p>
                    <p>
                      Last updated:{" "}
                      {profile.updatedAt
                        ? new Date(profile.updatedAt).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
