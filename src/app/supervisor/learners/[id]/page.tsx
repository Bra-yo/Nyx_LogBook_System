"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BookOpen, BriefcaseBusiness, CalendarDays, ClipboardCheck, Download, ExternalLink, FileText, MessageSquareText, Plus, QrCode, UserRound, Users } from "lucide-react";
import { MetricCard, ProgressMeter, RiskBadge } from "@/components/supervisor/mentorship-performance-card";

interface Learner {
  id: string;
  regNumber: string;
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    registrationIdentifier?: string | null;
  };
  cohort?: {
    name?: string | null;
    code?: string | null;
    mentorshipTrack?: string | null;
  } | null;
  mentorshipTrack?: string | null;
  department?: {
    name?: string | null;
    code?: string | null;
  } | null;
  supervisor?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
  documents?: {
    identity?: {
      verificationPath?: string | null;
      qrCode?: string | null;
      barcode?: string | null;
    } | null;
  };
  performance?: {
    attendancePercentage?: number;
    completedTasks?: number;
    pendingTasks?: number;
    completedWorklogs?: number;
    pendingWorklogs?: number;
    competenciesAchieved?: number;
    competenciesInProgress?: number;
    overallProgress?: number;
    riskStatus?: string;
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function SupervisorLearnerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesHistory, setNotesHistory] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/supervisor/learners/${params.id}`)
      .then((response) => response.json())
      .then((data) => setLearner(data.learner || null))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;

    try {
      const stored = window.localStorage.getItem(`mentor-notes-${params.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        queueMicrotask(() => {
          setNotesHistory(parsed);
          setNotes(parsed[0] || "");
        });
      }
    } catch {
      // ignore malformed storage values
    }
  }, [params.id]);

  const performance = learner?.performance;

  const attendancePercentage = performance?.attendancePercentage ?? 0;

  const summaryCards = useMemo<Array<{ label: string; value: string; tone?: "default" | "success" | "warning" | "danger" }>>(() => [
    { label: "Attendance %", value: `${attendancePercentage}%`, tone: attendancePercentage >= 70 ? "success" : attendancePercentage >= 50 ? "warning" : "danger" },
    { label: "Tasks Completed", value: `${performance?.completedTasks ?? 0}` },
    { label: "Tasks Pending", value: `${performance?.pendingTasks ?? 0}` },
    { label: "Worklogs Submitted", value: `${performance?.completedWorklogs ?? 0}` },
    { label: "Worklogs Pending", value: `${performance?.pendingWorklogs ?? 0}` },
    { label: "Competencies Achieved", value: `${performance?.competenciesAchieved ?? 0}` },
    { label: "Competencies In Progress", value: `${performance?.competenciesInProgress ?? 0}` },
  ], [attendancePercentage, performance?.completedTasks, performance?.pendingTasks, performance?.completedWorklogs, performance?.pendingWorklogs, performance?.competenciesAchieved, performance?.competenciesInProgress]);

  if (loading) return <DashboardLayout title="Learner Profile"><div className="h-64 animate-pulse rounded bg-muted" /></DashboardLayout>;
  if (!learner) return <DashboardLayout title="Learner Profile"><p className="text-muted-foreground">Learner profile unavailable.</p></DashboardLayout>;

  const identifier = learner.user.registrationIdentifier || learner.regNumber;

  const handleSaveNotes = () => {
    const trimmed = notes.trim();
    if (!trimmed) return;
    const nextHistory = [trimmed, ...notesHistory.filter((entry) => entry !== trimmed)].slice(0, 6);
    setNotesHistory(nextHistory);
    if (params.id) {
      window.localStorage.setItem(`mentor-notes-${params.id}`, JSON.stringify(nextHistory));
    }
  };

  return (
    <DashboardLayout title="Learner Profile">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Learners</Button>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={learner.user.avatar || undefined} alt={learner.user.name} />
                <AvatarFallback>{getInitials(learner.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{learner.user.name}</h2>
                <p className="text-muted-foreground">{identifier}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{learner.cohort?.name || "No cohort"}</Badge>
              <Badge variant="outline">{learner.cohort?.mentorshipTrack || learner.mentorshipTrack || "Track pending"}</Badge>
              {performance ? <RiskBadge status={performance.riskStatus} /> : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/supervisor/review"><Button variant="outline"><ClipboardCheck className="mr-2 h-4 w-4" />Review Work</Button></Link>
          <Button variant="outline"><CalendarDays className="mr-2 h-4 w-4" />Schedule Session</Button>
          <Link href="/supervisor/projects/new"><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Assign Project</Button></Link>
          <Button variant="outline"><MessageSquareText className="mr-2 h-4 w-4" />Send Message</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Profile, programme, and mentorship context.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Department" value={learner.department?.name || "Not assigned"} subtitle={learner.department?.code || ""} icon={<BookOpen className="h-4 w-4" />} />
            <MetricCard title="Cohort" value={learner.cohort?.name || "Not assigned"} subtitle={learner.cohort?.code || ""} icon={<Users className="h-4 w-4" />} />
            <MetricCard title="Registration Number" value={identifier} subtitle="Programme identifier" icon={<UserRound className="h-4 w-4" />} />
            <MetricCard title="Mentor" value={learner.supervisor?.user?.name || "Not assigned"} subtitle="Assigned supervisor" icon={<BriefcaseBusiness className="h-4 w-4" />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Attendance, task progress, worklog completion, and competency pace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <MetricCard key={card.label} title={card.label} value={card.value} subtitle="Current tracker" tone={card.tone} />
              ))}
            </div>
            {performance ? (
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Overall progress</p>
                    <RiskBadge status={performance.riskStatus} />
                  </div>
                  <div className="mt-3">
                    <ProgressMeter label="Programme progress" value={performance.overallProgress ?? 0} tone={performance.overallProgress !== undefined && performance.overallProgress >= 70 ? "success" : performance.overallProgress !== undefined && performance.overallProgress >= 50 ? "warning" : "danger"} />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Current risk status</p>
                  <p className="mt-2 text-sm text-muted-foreground">The system automatically flags a learner as green, amber, or red based on attendance, tasks, worklogs, and competency pace.</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Sessions</CardTitle>
              <CardDescription>Structured guidance touchpoints captured for this learner.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="mt-1 text-2xl font-semibold">0</p>
                <p className="text-xs text-muted-foreground">No planned sessions recorded yet.</p>
              </div>
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-semibold">0</p>
                <p className="text-xs text-muted-foreground">No completed sessions recorded yet.</p>
              </div>
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Missed</p>
                <p className="mt-1 text-2xl font-semibold">0</p>
                <p className="text-xs text-muted-foreground">No missed sessions registered yet.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Task delivery and follow-up progress.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-semibold">{performance?.completedTasks ?? 0}</p>
              </div>
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-semibold">{performance?.pendingTasks ?? 0}</p>
              </div>
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="mt-1 text-2xl font-semibold">{Math.max(0, (performance?.pendingTasks ?? 0) - 1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
            <CardDescription>Registration, admissions, and supporting evidence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a href={`/api/supervisor/learners/${learner.id}/admission-letter`}>
                  <FileText className="mr-2 h-4 w-4" />Admission Letter<Download className="ml-2 h-4 w-4" />
                </a>
              </Button>
              {learner.documents?.identity?.verificationPath ? (
                <Button variant="outline" asChild>
                  <a href={learner.documents.identity.verificationPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />Verify Registration
                  </a>
                </Button>
              ) : null}
            </div>
            {learner.documents?.identity ? (
              <div className="flex flex-wrap items-start gap-8 border-t pt-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Registration QR</p>
                  <img src={learner.documents.identity.qrCode || ""} alt="Registration QR" className="h-40 w-40" />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Barcode</p>
                  <img src={learner.documents.identity.barcode || ""} alt="Registration barcode" className="max-w-full" />
                </div>
                <QrCode className="hidden h-5 w-5" />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentor Notes</CardTitle>
            <CardDescription>Add, edit, and review action notes for this learner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Capture support actions, next steps, or follow-up reminders..." className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveNotes}>Save Note</Button>
              <Button variant="outline" onClick={() => { setNotes(""); if (params.id) { window.localStorage.removeItem(`mentor-notes-${params.id}`); } }}>Clear Draft</Button>
            </div>
            {notesHistory.length > 0 ? (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Recent notes</p>
                {notesHistory.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="rounded border bg-muted/40 p-3 text-sm text-muted-foreground">{entry}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes saved yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}