"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import NotificationCenter from "@/components/notifications/notification-center";

export default function WorkerNotificationsPage() {
  return (
    <DashboardLayout title="Notifications">
      <NotificationCenter
        apiPath="/api/worker/notifications"
        title="Worker notifications"
        subtitle="See updates from your supervisor and work log status."
      />
    </DashboardLayout>
  );
}
