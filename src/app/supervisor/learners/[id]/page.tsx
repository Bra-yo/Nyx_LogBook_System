"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, ExternalLink, FileText, QrCode, UserRound } from "lucide-react";

type Learner = any;

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

export default function SupervisorLearnerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/supervisor/learners/${params.id}`)
      .then((response) => response.json())
      .then((data) => setLearner(data.learner || null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <DashboardLayout title="Learner Profile"><div className="h-64 animate-pulse rounded bg-muted" /></DashboardLayout>;
  if (!learner) return <DashboardLayout title="Learner Profile"><p className="text-muted-foreground">Learner profile unavailable.</p></DashboardLayout>;

  const identifier = learner.user.registrationIdentifier || learner.regNumber;
  return (
    <DashboardLayout title="Learner Profile">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Learners</Button>
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><UserRound className="h-8 w-8 text-primary" /></div><div><h2 className="text-2xl font-semibold">{learner.user.name}</h2><p className="text-muted-foreground">{identifier}</p></div></div>
            <div className="flex flex-wrap gap-2"><Badge>{learner.cohort?.name || "No cohort"}</Badge><Badge variant="outline">{learner.cohort?.mentorshipTrack || learner.mentorshipTrack || "Track pending"}</Badge></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>Identity</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><p className="text-sm text-muted-foreground">Full Name</p><p>{learner.user.name}</p></div><div><p className="text-sm text-muted-foreground">Registration Identifier</p><p>{identifier}</p></div><div><p className="text-sm text-muted-foreground">Email</p><p>{learner.user.email}</p></div><div><p className="text-sm text-muted-foreground">Phone</p><p>{learner.user.phone || "Not provided"}</p></div><div><p className="text-sm text-muted-foreground">Mentorship Track</p><p>{learner.cohort?.mentorshipTrack || learner.mentorshipTrack || "Not assigned"}</p></div><div><p className="text-sm text-muted-foreground">Cohort</p><p>{learner.cohort ? `${learner.cohort.name} (${learner.cohort.code})` : "Not assigned"}</p></div></CardContent></Card>

        <Card><CardHeader><CardTitle>Progress</CardTitle><CardDescription>Activity and submission summary</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Portfolio" value={learner.progress.portfolio ? "Complete" : "Not started"} /><Stat label="Attendance" value={learner.progress.attendance} /><Stat label="Projects" value={learner.progress.projects} /><Stat label="Work Records" value={learner.progress.workRecords} /><Stat label="Reports" value={learner.progress.reports} /><Stat label="Submission History" value={learner.submissions.length} /></CardContent></Card>

        <Card><CardHeader><CardTitle>Account</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3"><Badge>Payment: {learner.user.paymentStatus}</Badge><Badge variant="outline">Account: {learner.user.accountStatus}</Badge></CardContent></Card>

        <Card><CardHeader><CardTitle>Documents</CardTitle><CardDescription>Registration and admission documents</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-3"><Button variant="outline" asChild><a href={`/api/supervisor/learners/${learner.id}/admission-letter`}><FileText className="mr-2 h-4 w-4" />Admission Letter<Download className="ml-2 h-4 w-4" /></a></Button>{learner.documents.identity?.verificationPath && <Button variant="outline" asChild><a href={learner.documents.identity.verificationPath} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Verify Registration</a></Button>}</div>{learner.documents.identity && <div className="flex flex-wrap items-start gap-8 border-t pt-4"><div><p className="mb-2 text-sm font-medium">Registration QR</p><img src={learner.documents.identity.qrCode} alt="Registration QR" className="h-40 w-40" /></div><div><p className="mb-2 text-sm font-medium">Barcode</p><img src={learner.documents.identity.barcode} alt="Registration barcode" className="max-w-full" /></div><QrCode className="hidden h-5 w-5" /></div>}</CardContent></Card>

        <Card><CardHeader><CardTitle>Submission History</CardTitle></CardHeader><CardContent className="space-y-2">{learner.submissions.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : learner.submissions.map((submission: any) => <div key={submission.id} className="flex items-center justify-between rounded border px-3 py-2"><span>{submission.title}</span><Badge variant="outline">{submission.status}</Badge></div>)}</CardContent></Card>
      </div>
    </DashboardLayout>
  );
}