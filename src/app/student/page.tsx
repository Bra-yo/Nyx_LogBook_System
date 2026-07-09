"use client";

import { WorkDashboard } from "@/components/work-management/work-dashboard";

export default function StudentDashboard() {
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
    />
  );
}
