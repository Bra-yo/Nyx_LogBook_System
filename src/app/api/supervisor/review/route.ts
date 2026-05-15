import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { companyMatches } from '@/lib/access-control'

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

    const where: any = {
      status: status || 'PENDING'
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!supervisor) {
      return NextResponse.json({ success: true, entries: [], pagination: { page, limit, total: 0, pages: 0 } })
    }

    const entries = await prisma.logbookEntry.findMany({
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
      }
    })

    const accessibleEntries = entries.filter((entry) =>
      companyMatches(supervisor.company, entry.student.internshipCompany)
    )

    const total = accessibleEntries.length
    const pagedEntries = accessibleEntries.slice(skip, skip + limit)

    return NextResponse.json({
      entries: pagedEntries,
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
