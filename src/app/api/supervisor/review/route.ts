import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const querySchema = {
  page: 1,
  limit: 10,
  status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
}

// GET - Fetch logbook entries for supervisor review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}

    // TEMPORARY: Remove status filtering to show all entries
    // Commenting out status filter for now to show all entries
    // if (status) {
    //   where.status = status
    // } else {
    //   // Default to showing PENDING entries for review
    //   where.status = 'PENDING'
    // }

    // TEMPORARY: Remove complex comment filtering that excludes entries
    // Only show entries that don't have a supervisor assessment yet
    // or have assessments with APPROVED status
    // where.comments = {
    //   none: {
    //     status: {
    //       in: ['APPROVED']
    //     }
    //   }
    // }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // TEMPORARY: Supervisors can view all student entries. Restore assignment-based filtering later if required.
    // Get all logbook entries that need supervisor review
    
    // DEBUG: Add temporary logs
    const totalLogbookEntries = await prisma.logbookEntry.count()
    console.log('DEBUG: Total logbook entries in database:', totalLogbookEntries)
    console.log('DEBUG: Status filter being used:', status || 'PENDING (default)')
    console.log('DEBUG: Where clause:', JSON.stringify(where, null, 2))
    
    const [entries, total] = await Promise.all([
      prisma.logbookEntry.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
              department: true
            }
          },
          comments: {
            include: {
              supervisor: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.logbookEntry.count({ where })
    ])
    
    console.log('DEBUG: Entries returned:', entries.length)
    console.log('DEBUG: Total entries matching filter:', total)

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get supervisor review entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
