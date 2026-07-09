"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ActiveSessionTimer } from "@/components/attendance/active-session-timer";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { QRScannerDialog } from "@/components/attendance/qr-scanner-dialog";

interface AttendanceContentProps {
  title?: string;
  heading?: string;
  description?: string;
  emptyStateMessage?: string;
}

export function AttendanceContent({
  title = "Attendance Management",
  heading = "Attendance Tracking",
  description = "Track your attendance with QR code check-in and check-out.",
  emptyStateMessage = "You are not currently checked in. Scan a QR code to start your attendance session.",
}: AttendanceContentProps) {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [todayTotalHours, setTodayTotalHours] = useState(0);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const searchParams = useSearchParams();

  const fetchAttendanceState = async () => {
    try {
      const response = await fetch("/api/attendance/active");
      const data = await response.json();

      setActiveSession(data.activeSession || null);
      setTodaySessions(data.todaySessions || []);
      setTodayTotalHours(data.todayTotalHours || 0);
      setCanCheckIn(data.canCheckIn ?? true);
      setCanCheckOut(data.canCheckOut ?? false);
    } catch (error) {
      console.error("Error checking active attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAttendanceState();
  }, []);

  const handleCheckInSuccess = async () => {
    await fetchAttendanceState();
    setShowQRScanner(false);
  };

  const handleCheckOutSuccess = async () => {
    await fetchAttendanceState();
  };

  const formatDuration = (
    hours?: number,
    status?: string,
    checkInTime?: string,
  ) => {
    if (status === "ACTIVE" && checkInTime) {
      const elapsedSeconds = Math.floor(
        (new Date().getTime() - new Date(checkInTime).getTime()) / 1000,
      );
      const hoursCount = Math.floor(elapsedSeconds / 3600);
      const minutesCount = Math.floor((elapsedSeconds % 3600) / 60);
      return `${hoursCount}h ${minutesCount}m`;
    }

    if (!hours) return "N/A";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <DashboardLayout title={title}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{heading}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {canCheckIn && (
            <Button onClick={() => setShowQRScanner(true)} className="gap-2">
              <QrCode className="h-4 w-4" />
              Check In
            </Button>
          )}
        </div>

        {activeSession ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">
                    Active Session
                  </CardTitle>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Checked In
                </Badge>
              </div>
              <CardDescription>
                You are currently checked in at{" "}
                {activeSession.officeLocation.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{activeSession.officeLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Checked in at{" "}
                      {format(new Date(activeSession.checkInTime), "HH:mm")}
                    </span>
                  </div>
                </div>
                <ActiveSessionTimer
                  checkInTime={activeSession.checkInTime}
                  onCheckOut={handleCheckOutSuccess}
                  attendanceId={activeSession.id}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle>No Active Session</CardTitle>
              </div>
              <CardDescription>{emptyStateMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowQRScanner(true)}
                className="w-full gap-2"
                size="lg"
              >
                <QrCode className="h-5 w-5" />
                Scan QR Code to Check In
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today&apos;s Sessions
            </CardTitle>
            <CardDescription>
              Total duration today: {todayTotalHours.toFixed(2)} hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <div className="text-muted-foreground">
                No attendance sessions recorded for today yet.
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-lg border bg-muted/5 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {session.officeLocation.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.officeLocation.address}
                        </div>
                      </div>
                      <Badge
                        className={
                          session.status === "ACTIVE"
                            ? "bg-blue-600"
                            : "bg-green-600"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <div>
                        <div className="font-medium text-foreground">
                          Check-in
                        </div>
                        <div>
                          {format(new Date(session.checkInTime), "HH:mm")}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          Check-out
                        </div>
                        <div>
                          {session.checkOutTime
                            ? format(new Date(session.checkOutTime), "HH:mm")
                            : "In progress"}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          Duration
                        </div>
                        <div>
                          {formatDuration(
                            session.hoursWorked,
                            session.status,
                            session.checkInTime,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AttendanceStats />

        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceHistory />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
              <CardDescription>
                A quick view of your attendance performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                No summary data available yet.
              </div>
            </CardContent>
          </Card>
        </div>

        <QRScannerDialog
          open={showQRScanner}
          onOpenChange={setShowQRScanner}
          onSuccess={handleCheckInSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
