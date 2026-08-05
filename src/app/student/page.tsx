"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkDashboard } from "@/components/work-management/work-dashboard";
import { StudentCompetencySummary } from "@/components/competency/student-competency-summary";

export default function StudentDashboard() {
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function checkOnboarding() {
      try {
        const response = await fetch("/api/student/onboarding");
        const data = await response.json().catch(() => ({}));
        if (isActive && response.ok && data.success && !data.studentProfile?.onboardingCompleted) {
          router.replace("/student/onboarding");
          return;
        }
      } catch (error) {
        console.error("Failed to check onboarding state", error);
      } finally {
        if (isActive) {
          setIsCheckingOnboarding(false);
        }
      }
    }

    void checkOnboarding();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (isCheckingOnboarding) {
    return <div className="container mx-auto py-10 text-muted-foreground">Preparing your dashboard…</div>;
  }

  return (
    <WorkDashboard
      layoutTitle="Student Dashboard"
      heroTitle="Student Work Overview"
      heroDescription="Track work records, review progress, and stay on top of your assignments."
      createHref="/student/logbook/new"
      workRecordsHref="/student/logbook"
      calendarHref="/student/calendar"
      reportsHref="/student/reports"
      entriesApiPath="/api/student/logbook"
      projectsApiPath="/api/student/projects"
    >
      <div className="rounded-lg border border-dashed border-muted/60 bg-muted/20 p-4">
        <StudentCompetencySummary />
      </div>
    </WorkDashboard>
  );
}
