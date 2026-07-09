import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalStudents,
      totalSupervisors,
      totalLecturers,
      totalAdmins,
      totalWorkers,
      totalDepartments,
      totalProjects,
      totalTasks,
      totalWorkLogs,
      approvedWorkLogs,
      pendingWorkLogs,
      rejectedWorkLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.user.count({ where: { role: "LECTURER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "WORKER" } }),
      prisma.department.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.taskWorkLog.count(),
      prisma.taskWorkLog.count({ where: { status: "APPROVED" } }),
      prisma.taskWorkLog.count({ where: { status: "PENDING" } }),
      prisma.taskWorkLog.count({ where: { status: "REJECTED" } }),
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
        totalProjects,
        totalTasks,
        totalWorkLogs,
        approvedWorkLogs,
        pendingWorkLogs,
        rejectedWorkLogs,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
