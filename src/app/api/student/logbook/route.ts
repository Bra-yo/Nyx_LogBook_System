import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const logbookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  activities: z.string().min(1, 'Activities are required'),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  milestoneId: z.string().min(1, 'Milestone selection is required'),
  milestoneTaskId: z.string().min(1, 'Task selection is required'),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  attachments: z.array(z.string()).default([])
})

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// GET - Fetch student's logbook entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const page = parseInt(validatedQuery.page)
    const limit = parseInt(validatedQuery.limit)
    const skip = (page - 1) * limit

    // Build filters
    const where: any = {
      studentId: studentProfile.id
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.date = {}
      if (validatedQuery.startDate) {
        where.date.gte = new Date(validatedQuery.startDate)
      }
      if (validatedQuery.endDate) {
        where.date.lte = new Date(validatedQuery.endDate)
      }
    }

    // Get entries and total count
    const [entries, total] = await Promise.all([
      prisma.logbookEntry.findMany({
        where,
        include: {
          comments: {
            include: {
              supervisor: {
                include: {
                  user: true
                }
              }
            }
          },
          assessments: {
            include: {
              lecturer: {
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
    console.error('Get logbook entries error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new logbook entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = logbookSchema.parse(body)

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Check if student has checked in today
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0) // Start of day
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999) // End of day

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: studentProfile.id,
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

    if (!todayAttendance) {
      return NextResponse.json({ 
        error: 'You must check in before creating a logbook entry for today.',
        requiresCheckIn: true
      }, { status: 403 })
    }

    // Validate milestone and task
    const task = await prisma.milestoneTask.findUnique({
      where: { id: validatedData.milestoneTaskId },
      include: { milestone: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Selected task not found' }, { status: 400 })
    }

    if (task.milestone.id !== validatedData.milestoneId) {
      return NextResponse.json({ error: 'Selected task does not belong to the selected milestone' }, { status: 400 })
    }

    // Create logbook entry
    const entry = await prisma.logbookEntry.create({
      data: {
        studentId: studentProfile.id,
        milestoneId: validatedData.milestoneId,
        milestoneTaskId: validatedData.milestoneTaskId,
        title: validatedData.title,
        description: validatedData.description,
        activities: validatedData.activities,
        challenges: validatedData.challenges,
        learnings: validatedData.learnings,
        date: validatedData.date,
        status: validatedData.status,
        attachments: validatedData.attachments,
        submittedAt: validatedData.status === 'PENDING' ? new Date() : undefined
      },
      include: {
        comments: {
          include: {
            supervisor: {
              include: {
                user: true
              }
            }
          }
        },
        assessments: {
          include: {
            lecturer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Logbook entry created successfully',
      entry
    })

  } catch (error) {
    console.error('Create logbook entry error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
