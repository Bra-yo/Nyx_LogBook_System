import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildMentorCohortLearnerWhereClause } from '@/lib/access-control'

const querySchema = {
  page: 1,
  limit: 10,
  search: undefined as string | undefined,
  status: undefined as 'ACTIVE' | 'COMPLETED' | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
}

// GET - Fetch attendance records for supervisor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status') as 'ACTIVE' | 'COMPLETED' | undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!supervisor) {
      return NextResponse.json({ records: [], pagination: { page, limit, total: 0, pages: 0 } })
    }

    // Build filters
    const where: any = { student: buildMentorCohortLearnerWhereClause(supervisor.id) }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.checkInTime = {}
      if (startDate) {
        where.checkInTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.checkInTime.lte = new Date(endDate)
      }
    }

    if (search) {
      where.student = {
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            regNumber: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          officeLocation: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        orderBy: {
          checkInTime: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.attendance.count({ where })
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get supervisor attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
