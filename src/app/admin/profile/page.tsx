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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit3, Mail, Phone, Building2, UserCircle2 } from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
  });

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/admin/profile");
      const data = await response.json();
      if (response.ok) {
        setProfile(data.admin);
        setFormData({
          name: data.admin?.user?.name || "",
          email: data.admin?.user?.email || "",
          phone: data.admin?.user?.phone || "",
          departmentId: data.admin?.departmentId || "",
        });
      } else {
        setError(data.error || "Unable to load administrator profile.");
      }
    } catch {
      setError("Unable to load administrator profile.");
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
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.admin);
        setSuccess("Profile updated successfully.");
        setEditing(false);
      } else {
        setError(data.error || "Unable to update profile.");
      }
    } catch {
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Administrator Profile">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Administrator profile</h2>
            <p className="text-sm text-muted-foreground">
              View and edit your administrative profile information.
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
            Loading profile...
          </div>
        ) : null}
        {!loading && !profile ? (
          <div className="rounded-lg border p-8 text-sm text-muted-foreground">
            No administrator profile found.
          </div>
        ) : null}
        {!loading && profile ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5" />
                  Overview
                </CardTitle>
                <CardDescription>
                  Current administrator profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Full name</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.user?.name || "Not available"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {profile.user?.email || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {profile.user?.phone || "Not available"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {profile.department?.name || "Not available"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Update profile</CardTitle>
                <CardDescription>
                  Edit your personal and departmental details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departmentId">Department ID</Label>
                      <Input
                        id="departmentId"
                        value={formData.departmentId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            departmentId: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>
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
                  <p className="text-sm text-muted-foreground">
                    Use the edit action to keep your profile current.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
