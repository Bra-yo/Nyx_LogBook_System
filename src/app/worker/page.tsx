"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TimeGreeting } from "@/components/common/time-greeting";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ListTodo,
  NotebookPen,
  QrCode,
} from "lucide-react";
import Link from "next/link";

interface AttendanceSummary {
  hasActiveSession?: boolean;
  hasAttendanceToday?: boolean;
  todayTotalHours?: number;
}

export default function WorkerDashboardPage() {
  const { data: session } = useSession();
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAttendance = async () => {
      try {
        const response = await fetch("/api/attendance/active");
        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            setAttendance(data);
          }
        }
      } catch (error) {
        console.error("Failed to load worker attendance summary:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadAttendance();
    return () => {
      isActive = false;
    };
  }, []);

  const attendanceStatus = attendance?.hasActiveSession
    ? "Checked in"
    : attendance?.hasAttendanceToday
      ? "Attendance recorded today"
      : "No attendance recorded today";

  const checkInStatus = attendance?.hasActiveSession
    ? "Attendance is currently active"
    : "Ready to check in from the attendance page";

  const checkoutStatus = attendance?.hasActiveSession
    ? "Check out is available now"
    : "Check out becomes available after check-in";

  const hoursWorked = attendance?.todayTotalHours?.toFixed(2) || "0.00";

  return (
    <DashboardLayout title="Worker Dashboard">
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <TimeGreeting userName={session?.user?.name} />
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Worker workspace
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Review your attendance, keep your work log current, and access
                the latest worker account details from a single place.
              </p>
            </div>
            <Link href="/worker/attendance" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Open Attendance
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Today&apos;s Attendance Status
              </CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight">
                {loading ? "Loading..." : attendanceStatus}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Updates from your latest attendance session.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Check In</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight">
                {loading ? "Loading..." : checkInStatus}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Available through the attendance workspace.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Check Out</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight">
                {loading ? "Loading..." : checkoutStatus}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Available after your attendance session starts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Hours Worked Today
              </CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight">
                {loading ? "Loading..." : `${hoursWorked}h`}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Calculated from completed attendance sessions.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Assigned Work
              </CardTitle>
              <CardDescription>
                Your current assignments and upcoming tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No upcoming tasks assigned.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5" />
                Recent Work Logs
              </CardTitle>
              <CardDescription>
                Recent entries from your work log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <ListTodo className="h-4 w-4" />
                  Pending Tasks
                </div>
                <p className="mt-2">No upcoming tasks assigned.</p>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Clock3 className="h-4 w-4" />
                  Recent Work Logs
                </div>
                <p className="mt-2">No recent work logs recorded.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
