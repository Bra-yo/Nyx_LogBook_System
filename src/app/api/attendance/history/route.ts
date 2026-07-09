import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const historySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.role ||
      !["STUDENT", "WORKER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validatedData = historySchema.parse(Object.fromEntries(searchParams));

    const roleFilter =
      session.user.role === "WORKER"
        ? { worker: { userId: session.user.id } }
        : { student: { userId: session.user.id } };

    const page = parseInt(validatedData.page);
    const limit = parseInt(validatedData.limit);
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: any = {};
    if (validatedData.startDate || validatedData.endDate) {
      dateFilter.checkInTime = {};
      if (validatedData.startDate) {
        dateFilter.checkInTime.gte = new Date(validatedData.startDate);
      }
      if (validatedData.endDate) {
        dateFilter.checkInTime.lte = new Date(validatedData.endDate);
      }
    }

    // Get attendance records
    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          ...roleFilter,
          ...dateFilter,
        },
        include: {
          officeLocation: true,
        },
        orderBy: {
          checkInTime: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.attendance.count({
        where: {
          ...roleFilter,
          ...dateFilter,
        },
      }),
    ]);

    // Calculate statistics
    const stats = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        ...roleFilter,
        ...dateFilter,
      },
      _count: {
        id: true,
      },
      _sum: {
        hoursWorked: true,
      },
    });

    const totalHours = stats.reduce(
      (sum, stat) => sum + (stat._sum.hoursWorked || 0),
      0,
    );
    const completedDays =
      stats.find((stat) => stat.status === "COMPLETED")?._count.id || 0;

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalHours: Math.round(totalHours * 100) / 100,
        completedDays,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Get attendance history error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
