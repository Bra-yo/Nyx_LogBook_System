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
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
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

    // Format response
    const analytics = {
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

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Get attendance analytics error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
