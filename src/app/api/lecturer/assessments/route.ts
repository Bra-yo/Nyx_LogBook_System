import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = {
  page: 1,
  limit: 10,
  status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
}

const assessmentSchema = z.object({
  logbookEntryId: z.string().min(1, 'Logbook entry ID is required'),
  technicalScore: z.number().min(0).max(100).optional(),
  communicationScore: z.number().min(0).max(100).optional(),
  professionalismScore: z.number().min(0).max(100).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  status: z.enum(['NOT_ASSESSED', 'IN_PROGRESS', 'COMPLETED']).default('IN_PROGRESS')
})

// GET - Fetch logbook entries for lecturer assessment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'LECTURER') {
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
    //   // Default to showing PENDING entries for assessment
    //   where.status = 'PENDING'
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

    // TEMPORARY: Lecturers can view all student entries. Restore assignment-based filtering later if required.
    // Get all logbook entries that need lecturer assessment
    
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
          assessments: {
            include: {
              lecturer: {
                include: {
                  user: true
                }
              }
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
      success: true,
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get lecturer assessments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new lecturer assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'LECTURER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assessmentSchema.parse(body)

    // Get lecturer profile
    const lecturerProfile = await prisma.lecturerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!lecturerProfile) {
      return NextResponse.json({ error: 'Lecturer profile not found' }, { status: 404 })
    }

    // Get logbook entry to extract student ID
    const logbookEntry = await prisma.logbookEntry.findUnique({
      where: { id: validatedData.logbookEntryId }
    })

    if (!logbookEntry) {
      return NextResponse.json({ error: 'Logbook entry not found' }, { status: 404 })
    }

    // Check if assessment already exists for this entry
    const existingAssessment = await prisma.lecturerAssessment.findFirst({
      where: {
        logbookEntryId: validatedData.logbookEntryId,
        lecturerId: lecturerProfile.id
      }
    })

    if (existingAssessment) {
      return NextResponse.json({ error: 'Assessment already exists for this entry' }, { status: 409 })
    }

    // Create new assessment
    const newAssessment = await prisma.lecturerAssessment.create({
      data: {
        studentId: logbookEntry.studentId,
        logbookEntryId: validatedData.logbookEntryId,
        lecturerId: lecturerProfile.id,
        technicalScore: validatedData.technicalScore,
        communicationScore: validatedData.communicationScore,
        professionalismScore: validatedData.professionalismScore,
        overallScore: validatedData.overallScore,
        feedback: validatedData.feedback,
        status: validatedData.status,
        assessedAt: validatedData.status === 'COMPLETED' ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment created successfully',
      assessment: newAssessment
    })

  } catch (error) {
    console.error('Create assessment error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
