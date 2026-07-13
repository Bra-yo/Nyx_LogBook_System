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
import {
  Edit3,
  Mail,
  Phone,
  Building2,
  Briefcase,
  UserCircle2,
} from "lucide-react";

export default function SupervisorProfilePage() {
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
    title: "",
    company: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/supervisor/profile");
      const data = await response.json();
      if (response.ok) {
        setProfile(data.supervisor);
        setFormData({
          name: data.supervisor?.user?.name || "",
          email: data.supervisor?.user?.email || "",
          phone: data.supervisor?.user?.phone || "",
          title: data.supervisor?.title || "",
          company: data.supervisor?.company || "",
        });
      } else {
        setError(data.error || "Unable to load supervisor profile.");
      }
    } catch {
      setError("Unable to load supervisor profile.");
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
      const response = await fetch("/api/supervisor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.supervisor);
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
    <DashboardLayout title="Supervisor Profile">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Supervisor profile</h2>
            <p className="text-sm text-muted-foreground">
              View and update your professional information.
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
            No supervisor profile found.
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
                  Your current supervisor details.
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Title</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {profile.title || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {profile.company || "Not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update profile</CardTitle>
                <CardDescription>
                  Revise your contact and professional details.
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
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
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
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Use the edit action to keep your contact and professional
                      information current.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
