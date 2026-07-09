import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const department = searchParams.get("department") || "all";

    // Get analytics data
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get attendance statistics
    const [totalRecords, activeSessions, completedSessions] = await Promise.all(
      [
        prisma.attendance.count({
          where: {
            checkInTime: {
              gte: startDate,
            },
          },
        }),
        prisma.attendance.count({
          where: {
            checkInTime: {
              gte: startDate,
            },
            status: "ACTIVE",
          },
        }),
        prisma.attendance.count({
          where: {
            checkInTime: {
              gte: startDate,
            },
            status: "COMPLETED",
          },
        }),
      ],
    );

    // Calculate completion rate
    const completionRate =
      totalRecords > 0
        ? Math.round((completedSessions / totalRecords) * 100)
        : 0;

    // Calculate total hours (simplified - assume 8 hours per completed session)
    const totalHours = completedSessions * 8;

    // Get daily stats for the period
    const dailyStats = await prisma.attendance.groupBy({
      by: ["checkInTime"],
      where: {
        checkInTime: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        checkInTime: "asc",
      },
    });

    // Format daily stats
    const formattedDailyStats = dailyStats.map((stat) => ({
      date: stat.checkInTime.toISOString().split("T")[0],
      recordsCount: stat._count.id,
    }));

    // Get top students (simplified - by attendance count)
    const topStudentsQuery = await prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        checkInTime: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Get student details for top students
    const studentIds = topStudentsQuery
      .map((item) => item.studentId)
      .filter((id): id is string => id !== null);

    const students = await prisma.studentProfile.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      include: {
        user: true,
        department: true,
      },
    });

    const topStudents = topStudentsQuery.map((item, index) => {
      const student = students.find((s) => s.id === item.studentId);
      return {
        rank: index + 1,
        studentName: student?.user?.name || "Unknown",
        department: student?.department?.name || "Unknown",
        totalHours: item._count.id * 8, // Simplified calculation
        sessionsCount: item._count.id,
      };
    });

    return NextResponse.json({
      overview: {
        totalRecords,
        activeSessions,
        completedSessions,
        completionRate,
        totalHours,
      },
      dailyStats: formattedDailyStats,
      topStudents,
    });
  } catch (error) {
    console.error("Get attendance analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
