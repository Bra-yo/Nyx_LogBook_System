"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SupervisorCohortsPage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/supervisor/cohorts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCohorts(data.cohorts || []);
          setSelectedCohortId(data.cohorts?.[0]?.id || null);
        }
      });
  }, []);

  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) || cohorts[0];

  return (
    <DashboardLayout title="My Cohorts">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Cohorts</CardTitle>
            <CardDescription>Browse each cohort with its mentee list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cohorts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cohorts assigned yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {cohorts.map((cohort) => (
                  <button key={cohort.id} onClick={() => setSelectedCohortId(cohort.id)} className={`rounded-lg border p-4 text-left ${selectedCohort?.id === cohort.id ? "border-primary" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cohort.name}</p>
                        <p className="text-sm text-muted-foreground">{cohort.code}</p>
                      </div>
                      <Badge>{cohort.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>Total Mentees: {cohort._count?.members ?? 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCohort && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedCohort.name}</CardTitle>
              <CardDescription>{selectedCohort.code} · {selectedCohort.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedCohort.members?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mentees in this cohort yet.</p>
              ) : (
                selectedCohort.members.map((member: any) => (
                  <Link key={member.id} href={`/supervisor/learners/${member.id}`} className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted">
                    <div>
                      <p className="font-medium">{member.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                    </div>
                    <Badge variant="outline">Mentee</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
