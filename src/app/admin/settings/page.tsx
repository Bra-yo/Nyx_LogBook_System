"use client";

import { useState, useEffect } from "react";
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
import {
  Settings,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Database,
  Mail,
  Users,
} from "lucide-react";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  sessionTimeout: number;
  maxFileSize: number;
  backupFrequency: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "BG HUB Consulting LTD WorkLog System",
    siteDescription:
      "A digital WorkLog and attendance management system for BG HUB Consulting LTD.",
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    sessionTimeout: 24,
    maxFileSize: 10,
    backupFrequency: "daily",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      // const response = await fetch('/api/admin/settings')
      // if (response.ok) {
      //   const data = await response.json()
      //   setSettings(data.settings)
      // }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // TODO: Implement actual API call
      // const response = await fetch('/api/admin/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // })
      // if (response.ok) {
      //   // Show success message
      // }

      console.log("Saving settings:", settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/admin/settings/reset', {
      //   method: 'POST'
      // })
      // if (response.ok) {
      //   await fetchSettings()
      // }

      console.log("Resetting to defaults...");
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-muted-foreground">
              Configure system-wide settings and preferences
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetToDefaults} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      siteName: e.target.value,
                    }))
                  }
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      siteDescription: e.target.value,
                    }))
                  }
                  placeholder="Enter site description"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Control user access and registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow User Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable new user self-registration
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    allowRegistration: e.target.checked,
                  }))
                }
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to users
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    emailNotifications: e.target.checked,
                  }))
                }
                className="w-4 h-4"
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value),
                  }))
                }
                min="1"
                max="168"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>Technical system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    maxFileSize: parseInt(e.target.value),
                  }))
                }
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                id="backupFrequency"
                value={settings.backupFrequency}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    backupFrequency: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Security and access control configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <p>Security settings configuration coming soon...</p>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>SMTP and email delivery settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4" />
              <p>Email configuration coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
