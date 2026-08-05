"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import NotificationCenter from "@/components/notifications/notification-center";

export default function StudentNotificationsPage() {
  return (
    <DashboardLayout title="Notifications">
      <NotificationCenter
        apiPath="/api/student/notifications"
        title="Student notifications"
        subtitle="Stay updated with your internship activities."
      />
    </DashboardLayout>
  );
}
