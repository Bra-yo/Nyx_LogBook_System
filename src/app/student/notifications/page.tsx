"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/student/notifications')
      // if (response.ok) {
      //   const data = await response.json()
      //   setNotifications(data.notifications || [])
      // }

      // Mock data for now
      setNotifications([
        {
          id: "1",
          title: "Work Record Reviewed",
          message:
            "Your supervisor has reviewed your work record from yesterday.",
          type: "success",
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Attendance Reminder",
          message: "Remember to check in for your internship today.",
          type: "info",
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Implement actual API call
      // await fetch(`/api/student/notifications/${notificationId}/read`, {
      //   method: 'POST'
      // })

      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implement actual API call
      // await fetch('/api/student/notifications/read-all', {
      //   method: 'POST'
      // })

      setNotifications(
        notifications.map((notif) => ({ ...notif, read: true })),
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <DashboardLayout title="Notifications">
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">
              Stay updated with your internship activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! No new notifications at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-colors ${
                  !notification.read ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === "success"
                            ? "bg-green-100 text-green-600"
                            : notification.type === "warning"
                              ? "bg-yellow-100 text-yellow-600"
                              : notification.type === "error"
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-4 w-4" />
                          {format(
                            new Date(notification.createdAt),
                            "MMM dd, yyyy at HH:mm",
                          )}
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
