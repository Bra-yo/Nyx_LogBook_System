import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get user counts by role
    const [
      totalStudents,
      totalSupervisors,
      totalLecturers,
      totalAdmins,
      totalWorkers,
      totalDepartments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.user.count({ where: { role: "LECTURER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "WORKER" } }),
      prisma.department.count(),
    ]);

    // Get logbook stats
    const [totalLogbookEntries, pendingReviews, weeklySubmissions] =
      await Promise.all([
        prisma.logbookEntry.count(),
        prisma.supervisorComment.count({ where: { status: "PENDING" } }),
        prisma.logbookEntry.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalSupervisors,
        totalLecturers,
        totalAdmins,
        totalWorkers,
        totalDepartments,
        totalLogbookEntries,
        pendingReviews,
        weeklySubmissions,
        systemUptime: "99.9%", // This would come from monitoring system
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
