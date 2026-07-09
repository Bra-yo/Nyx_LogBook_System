"use client";

import { WorkLogbookPage } from "@/components/work-management/work-logbook-page";

export default function LogbookPage() {
  return (
    <WorkLogbookPage
      layoutTitle="WorkLog Records"
      heading="WorkLog Records"
      description="Manage your daily and weekly work records"
      createHref="/student/logbook/new"
      entryBasePath="/student/logbook"
      entriesApiPath="/api/student/logbook"
      attendanceApiPath="/api/attendance/active"
      attendanceRedirectHref="/student/attendance?redirect=/student/logbook"
      requiresAttendance
    />
  );
}
