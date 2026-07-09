import { WorkLogbookPage } from "@/components/work-management/work-logbook-page";

export default function WorkerLogbookPage() {
  return (
    <WorkLogbookPage
      layoutTitle="Worker WorkLog"
      heading="Worker WorkLog"
      description="Review and manage your daily work records."
      createHref="/worker/logbook/new"
      entryBasePath="/worker/logbook"
      entriesApiPath="/api/worker/logbook"
      requiresAttendance={false}
    />
  );
}
