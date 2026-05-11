import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
  search: z.string().optional(),
  departmentId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(validatedQuery.page)
    const limit = parseInt(validatedQuery.limit)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (validatedQuery.status) {
      where.status = validatedQuery.status
    }

    if (validatedQuery.search || validatedQuery.departmentId) {
      where.OR = []
      
      if (validatedQuery.search) {
        where.OR.push(
          {
            student: {
              user: {
                name: { contains: validatedQuery.search, mode: 'insensitive' }
              }
            }
          },
          {
            student: {
              user: {
                email: { contains: validatedQuery.search, mode: 'insensitive' }
              }
            }
          },
          {
            student: {
              regNumber: { contains: validatedQuery.search, mode: 'insensitive' }
            }
          }
        )
      }

      if (validatedQuery.departmentId) {
        where.OR.push(
          {
            student: {
              departmentId: validatedQuery.departmentId
            }
          },
          {
            officeLocation: {
              departmentId: validatedQuery.departmentId
            }
          }
        )
      }
    }

    // Get attendance records and stats
    const [records, total, stats] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
              department: true
            }
          },
          officeLocation: true
        },
        orderBy: {
          checkInTime: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.attendance.count({ where }),
      prisma.attendance.aggregate({
        where,
        _sum: {
          hoursWorked: true
        },
        _count: {
          id: true
        }
      })
    ])

    // Calculate additional stats
    const activeSessions = await prisma.attendance.count({
      where: {
        status: 'ACTIVE',
        ...(validatedQuery.departmentId && {
          officeLocation: {
            departmentId: validatedQuery.departmentId
          }
        })
      }
    })

    const totalDays = new Set(
      records.map(r => new Date(r.checkInTime).toDateString())
    ).size

    // Remove passwords from response
    const recordsWithoutPasswords = records.map(record => ({
      ...record,
      student: {
        ...record.student,
        user: {
          ...record.student.user,
          password: undefined
        }
      }
    }))

    return NextResponse.json({
      records: recordsWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalHours: stats._sum.hoursWorked || 0,
        totalDays,
        activeSessions
      }
    })

  } catch (error) {
    console.error('Get admin attendance error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
