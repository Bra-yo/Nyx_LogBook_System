"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, FileText, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface CalendarEvent {
  id: string;
  date: string;
  type: "attendance" | "logbook";
  title: string;
  description?: string;
  status?: string;
  time?: string;
}

export default function StudentCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      // Fetch attendance records
      const attendanceResponse = await fetch(
        "/api/attendance/history?limit=100",
      );
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        const attendanceEvents = (attendanceData.records || []).map(
          (record: any) => ({
            id: `attendance-${record.id}`,
            date: format(new Date(record.checkInTime), "yyyy-MM-dd"),
            type: "attendance" as const,
            title: "Attendance Check-in",
            description: `Checked in at ${format(new Date(record.checkInTime), "HH:mm")}`,
            status: record.status,
            time: format(new Date(record.checkInTime), "HH:mm"),
          }),
        );

        // Fetch logbook entries
        const logbookResponse = await fetch("/api/student/logbook?limit=100");
        let logbookEvents: CalendarEvent[] = [];

        if (logbookResponse.ok) {
          const logbookData = await logbookResponse.json();
          logbookEvents = (logbookData.entries || []).map((entry: any) => ({
            id: `logbook-${entry.id}`,
            date: format(new Date(entry.date), "yyyy-MM-dd"),
            type: "logbook" as const,
            title: entry.title,
            description: entry.description,
            status: entry.status,
            time: format(new Date(entry.date), "HH:mm"),
          }));
        }

        setEvents([...attendanceEvents, ...logbookEvents]);
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((event) => event.date === dateStr);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "ACTIVE":
      case "PENDING":
        return <Badge className="bg-blue-600">Active</Badge>;
      case "DRAFT":
        return <Badge className="bg-gray-600">Draft</Badge>;
      case "CANCELLED":
      case "REJECTED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <Clock className="h-4 w-4" />;
      case "logbook":
        return <FileText className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Calendar">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Calendar">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Academic Calendar</h2>
          <p className="text-muted-foreground">
            View your attendance and work records by date
          </p>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(selectedDate, "MMMM yyyy")}
            </CardTitle>
            <CardDescription>
              Your work activities and attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 text-sm font-medium text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day} className="text-center p-2">
                      {day}
                    </div>
                  ),
                )}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    i - 2,
                  );
                  const isCurrentMonth =
                    date.getMonth() === selectedDate.getMonth();
                  const dayEvents = getEventsForDate(date);
                  const isToday =
                    format(date, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd");

                  return (
                    <div
                      key={i}
                      className={`
                        min-h-[80px] p-2 border rounded-lg
                        ${isCurrentMonth ? "bg-background" : "bg-muted/20"}
                        ${isToday ? "border-primary" : "border-border"}
                        ${dayEvents.length > 0 ? "border-primary/50" : ""}
                      `}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(date, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`
                              text-xs p-1 rounded flex items-center gap-1
                              ${event.type === "attendance" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                            `}
                          >
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
            <CardDescription>
              Activities and attendance for selected date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayEvents = getEventsForDate(selectedDate);
              return dayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No events scheduled for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <div>
                              <div className="font-medium">{event.title}</div>
                              {event.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </div>
                              )}
                              {event.time && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {event.time}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
