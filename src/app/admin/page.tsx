"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ClipboardList,
  FolderKanban,
  GraduationCap,
  ListChecks,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalSupervisors: number;
  totalLecturers: number;
  totalAdmins: number;
  totalWorkers: number;
  totalLearningAreas: number;
  weeklySubmissions: number;
  pendingReviews: number;
  systemUptime: string;
}

const actionGroups = [
  {
    title: "People & access",
    description: "Maintain learner, mentor, and admin accounts.",
    items: [
      { label: "User management", href: "/admin/users", icon: Users },
      { label: "Cohorts", href: "/admin/cohorts", icon: FolderKanban },
      { label: "Learning areas", href: "/admin/learning-areas", icon: BookOpen },
    ],
  },
  {
    title: "Learning & mentoring",
    description: "Coordinate curriculum, mentor matching, and progress.",
    items: [
      { label: "Learning architecture", href: "/admin/learning-areas", icon: BookOpen },
      { label: "Attendance", href: "/admin/attendance", icon: ClipboardList },
      { label: "Competency assessments", href: "/admin/competency-assessments", icon: GraduationCap },
    ],
  },
  {
    title: "Operations",
    description: "Keep the platform healthy and visible to leadership.",
    items: [
      { label: "System analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "System logs", href: "/admin/logs", icon: Activity },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalSupervisors: 0,
    totalLecturers: 0,
    totalAdmins: 0,
    totalWorkers: 0,
    totalLearningAreas: 0,
    weeklySubmissions: 0,
    pendingReviews: 0,
    systemUptime: "99.9%",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Operations control centre</h2>
            <p className="text-muted-foreground">
              Monitor momentum, launch actions, and guide the mentorship workflow from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/cohorts">
              <Button variant="outline">
                <FolderKanban className="mr-2 h-4 w-4" />
                Manage cohorts
              </Button>
            </Link>
            <Link href="/admin/users/new">
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Add user
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-primary/20 bg-[linear-gradient(135deg,var(--color-background)_0%,var(--color-background)_50%,var(--color-primary)_100%)]/5">
          <CardHeader>
            <CardTitle className="text-lg">Today at a glance</CardTitle>
            <CardDescription>
              A practical summary of the operational pulse across people, learning, and delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">Active learners</div>
              <div className="mt-2 text-2xl font-semibold">{isLoading ? "—" : stats.totalStudents}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">Mentor reviews</div>
              <div className="mt-2 text-2xl font-semibold">{isLoading ? "—" : stats.pendingReviews}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">Weekly submissions</div>
              <div className="mt-2 text-2xl font-semibold">{isLoading ? "—" : stats.weeklySubmissions}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">System uptime</div>
              <div className="mt-2 text-2xl font-semibold">{stats.systemUptime}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learners</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active learner accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mentors</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalSupervisors}</div>
              <p className="text-xs text-muted-foreground">Assigned mentor capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workers</CardTitle>
              <BriefcaseBusiness className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.totalWorkers}</div>
              <p className="text-xs text-muted-foreground">Operational staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning areas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLearningAreas}</div>
              <p className="text-xs text-muted-foreground">Curriculum areas in the admin architecture</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Priority queue
              </CardTitle>
              <CardDescription>What needs attention this week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Pending reviews</span>
                  <span className="text-xl font-semibold text-yellow-600">{stats.pendingReviews}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Follow up with supervisors and keep assessment flow moving.</p>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Weekly submissions</span>
                  <span className="text-xl font-semibold">{stats.weeklySubmissions}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Track learner submissions, milestones, and follow-up tasks.</p>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Mentor coverage</span>
                  <span className="text-xl font-semibold">{stats.totalSupervisors}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Keep mentor allocations aligned to learning areas and learner demand.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quick actions
              </CardTitle>
              <CardDescription>Jump into the most common admin workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  User management
                </Button>
              </Link>
              <Link href="/admin/learning-areas">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Learning architecture
                </Button>
              </Link>
              <Link href="/admin/attendance">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Attendance oversight
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {actionGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
