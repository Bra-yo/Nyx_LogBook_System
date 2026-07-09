"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, BellRing } from "lucide-react";

export default function WorkerSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirmation do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess("Password updated successfully.");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(data.error || "Unable to update password.");
      }
    } catch (err) {
      console.error("Failed to change password", err);
      setError("Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Worker Settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Account settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account security and notification preferences.
          </p>
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

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change password
              </CardTitle>
              <CardDescription>
                Use a strong password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        currentPassword: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        newPassword: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        confirmPassword: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Account security
              </CardTitle>
              <CardDescription>
                Current sign-in details for this worker account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">Signed in as</p>
                <p>{session?.user?.email || "No active session"}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">Password policy</p>
                <p>
                  Use at least 8 characters and a mix of letters, numbers, and
                  symbols.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">Notifications</p>
                <p>
                  Alerts for attendance and work log updates remain enabled by
                  default.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
