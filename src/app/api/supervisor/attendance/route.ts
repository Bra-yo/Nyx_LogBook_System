import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Build filters
    const where: any = {}

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

    // TEMPORARY: Supervisors can view all students. Restore assignment-based filtering later if required.
    // Get all attendance records
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
