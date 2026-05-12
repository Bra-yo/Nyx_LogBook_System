import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['ADMIN', 'LECTURER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}

    if (search) {
      where.OR = [
        {
          student: {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          student: {
            user: {
              email: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    }

    if (startDate || endDate) {
      where.AND = [{
        attendance: {
          checkInTime: {}
        }
      }]
      
      if (startDate) {
        where.AND[0].attendance.checkInTime.gte = new Date(startDate)
      }
      
      if (endDate) {
        where.AND[0].attendance.checkInTime.lte = new Date(endDate)
      }
    }

    // TEMPORARY: Lecturers can view all students. Restore assignment-based filtering later if required.
    // Get all attendance records for lecturer view
    const [records, total] = await Promise.all([
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
      prisma.attendance.count({ where })
    ])

    return NextResponse.json({
      success: true,
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get lecturer attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
