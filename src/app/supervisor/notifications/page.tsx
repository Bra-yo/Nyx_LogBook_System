"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import NotificationCenter from "@/components/notifications/notification-center";

export default function SupervisorNotificationsPage() {
  return (
    <DashboardLayout title="Notifications">
      <NotificationCenter
        apiPath="/api/supervisor/notifications"
        title="Supervisor notifications"
        subtitle="Stay updated with student activity and review requests."
      />
    </DashboardLayout>
  );
}
