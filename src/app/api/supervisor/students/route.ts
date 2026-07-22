import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildMentorCohortLearnerWhereClause } from '@/lib/access-control'

const querySchema = {
  page: 1,
  limit: 10,
  search: undefined as string | undefined,
  departmentId: undefined as string | undefined
}

// GET - Fetch all students for supervisor
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
    const departmentId = searchParams.get('departmentId')

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor profile not found' }, { status: 404 })
    }

    const skip = (page - 1) * limit

    // Build base filters for supervisor students queries
    const where: any = buildMentorCohortLearnerWhereClause(supervisor.id)

    if (search) {
      where.OR = [
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

    if (departmentId) {
      where.departmentId = departmentId
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            registrationIdentifier: true,
            paymentStatus: true,
            accountStatus: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        cohort: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        supervisor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        lecturer: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            logbookEntries: true,
            attendanceRecords: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const total = students.length
    const pagedStudents = students.slice(skip, skip + limit)

    return NextResponse.json({
      success: true,
      students: pagedStudents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get supervisor students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
