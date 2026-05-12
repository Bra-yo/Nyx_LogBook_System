import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const analyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['ADMIN', 'STUDENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validatedData = analyticsSchema.parse(Object.fromEntries(searchParams))

    // Build date filter
    const dateFilter: any = {}
    if (validatedData.startDate || validatedData.endDate) {
      dateFilter.checkInTime = {}
      if (validatedData.startDate) {
        dateFilter.checkInTime.gte = new Date(validatedData.startDate)
      }
      if (validatedData.endDate) {
        dateFilter.checkInTime.lte = new Date(validatedData.endDate)
      }
    }

    // Build department filter
    const departmentFilter: any = {}
    if (validatedData.departmentId) {
      departmentFilter.student = {
        departmentId: validatedData.departmentId
      }
    }

    // If student, only show their own attendance
    if (session.user.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id }
      })
      if (studentProfile) {
        departmentFilter.student = {
          id: studentProfile.id
        }
      }
    }

    // Get overall statistics
    const [
      totalRecords,
      activeSessions,
      completedSessions,
      totalHours,
      averageHours,
      dailyStats,
      topStudents,
      departmentStats
    ] = await Promise.all([
      // Total attendance records
      prisma.attendance.count({
        where: {
          ...dateFilter,
          ...departmentFilter
        }
      }),
      
      // Active sessions
      prisma.attendance.count({
        where: {
          status: 'ACTIVE',
          ...dateFilter,
          ...departmentFilter
        }
      }),
      
      // Completed sessions
      prisma.attendance.count({
        where: {
          status: 'COMPLETED',
          ...dateFilter,
          ...departmentFilter
        }
      }),
      
      // Total hours worked
      prisma.attendance.aggregate({
        where: {
          status: 'COMPLETED',
          ...dateFilter,
          ...departmentFilter
        },
        _sum: {
          hoursWorked: true
        }
      }),
      
      // Average hours per session
      prisma.attendance.aggregate({
        where: {
          status: 'COMPLETED',
          ...dateFilter,
          ...departmentFilter
        },
        _avg: {
          hoursWorked: true
        }
      }),
      
      // Daily statistics
      prisma.attendance.groupBy({
        by: ['checkInTime'],
        where: {
          ...dateFilter,
          ...departmentFilter
        },
        _count: {
          id: true
        },
        _sum: {
          hoursWorked: true
        }
      }),
      
      // Top students by hours
      prisma.attendance.groupBy({
        by: ['studentId'],
        where: {
          status: 'COMPLETED',
          ...dateFilter,
          ...departmentFilter
        },
        _sum: {
          hoursWorked: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            hoursWorked: 'desc'
          }
        },
        take: 10
      }),
      
      // Department statistics
      prisma.attendance.groupBy({
        by: ['studentId'],
        where: {
          status: 'COMPLETED',
          ...dateFilter
        },
        _sum: {
          hoursWorked: true
        },
        _count: {
          id: true
        }
      })
    ])

    // Get student details for top students
    const topStudentsWithDetails = await prisma.studentProfile.findMany({
      where: {
        id: {
          in: topStudents.map(student => student.studentId)
        }
      },
      include: {
        user: true,
        department: true
      }
    })

    // Get active session for student
    let activeSessionDuration = 0
    if (session.user.role === 'STUDENT') {
      const activeSession = await prisma.attendance.findFirst({
        where: {
          studentId: departmentFilter.student.id,
          status: 'ACTIVE'
        }
      })
      if (activeSession && activeSession.checkInTime) {
        const now = new Date()
        const checkInTime = new Date(activeSession.checkInTime)
        activeSessionDuration = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) // hours
      }
    }

    // Format response
    const analytics: any = {
      overview: {
        totalRecords,
        activeSessions,
        completedSessions,
        totalHours: Math.round((totalHours._sum.hoursWorked || 0) * 100) / 100,
        averageHours: Math.round((averageHours._avg.hoursWorked || 0) * 100) / 100,
        completionRate: totalRecords > 0 ? Math.round((completedSessions / totalRecords) * 100) : 0
      },
      
      topStudents: topStudents.map((student, index) => {
        const studentDetails = topStudentsWithDetails.find(detail => detail.id === student.studentId)
        return {
          rank: index + 1,
          studentName: studentDetails?.user.name || 'Unknown',
          studentEmail: studentDetails?.user.email || 'unknown',
          department: studentDetails?.department.name || 'Unknown',
          totalHours: Math.round((student._sum.hoursWorked || 0) * 100) / 100,
          sessionsCount: student._count.id
        }
      }),
      
      dailyStats: dailyStats.map(stat => ({
        date: stat.checkInTime.toISOString().split('T')[0],
        recordsCount: stat._count.id,
        totalHours: Math.round((stat._sum.hoursWorked || 0) * 100) / 100
      }))
    }

    // Add student-specific data to response
    if (session.user.role === 'STUDENT') {
      const today = new Date()
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0) // Start of day
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999) // End of day

      const todayAttendance = await prisma.attendance.findFirst({
        where: {
          studentId: departmentFilter.student.id,
          checkInTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          OR: [
            { status: 'ACTIVE' },
            { status: 'COMPLETED' }
          ]
        }
      })

      const presentDays = todayAttendance ? 1 : 0
      const totalDays = 1 // Today
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

      // Add student-specific data to response
      analytics.studentStats = {
        totalHours: Math.round((totalHours._sum.hoursWorked || 0) * 100) / 100 + Math.round(activeSessionDuration * 100) / 100,
        averageHours: Math.round((averageHours._avg.hoursWorked || 0) * 100) / 100,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        lateDays: 0, // TODO: implement late calculation
        overtimeHours: 0, // TODO: implement overtime calculation
        attendanceRate,
        activeSessionDuration: Math.round(activeSessionDuration * 100) / 100
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Get attendance analytics error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
