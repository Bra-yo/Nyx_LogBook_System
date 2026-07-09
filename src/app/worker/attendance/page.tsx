import { Suspense } from "react";
import { AttendanceContent } from "@/components/attendance/attendance-content";

export default function WorkerAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-muted-foreground">Loading attendance…</div>
      }
    >
      <AttendanceContent
        title="Worker Attendance"
        heading="Worker Attendance Tracking"
        description="Use QR check-in and check-out to track your attendance securely."
        emptyStateMessage="You are not currently checked in. Scan a QR code to start your attendance session."
      />
    </Suspense>
  );
}
