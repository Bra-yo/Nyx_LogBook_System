import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const querySchema = {
  page: 1,
  limit: 10,
  search: undefined as string | undefined,
  departmentId: undefined as string | undefined
}

// GET - Fetch all students for lecturer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'LECTURER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const departmentId = searchParams.get('departmentId')

    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}

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

    // TEMPORARY: Lecturers can view all students. Restore assignment-based filtering later if required.
    // Get all student profiles
    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
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
        },
        skip,
        take: limit
      }),
      prisma.studentProfile.count({ where })
    ])

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get lecturer students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
