import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const competencyLevels = [
  {
    score: 1,
    label: 'Novice',
    description: 'Unable to perform task without continuous guidance.'
  },
  {
    score: 2,
    label: 'Beginner',
    description: 'Performs task with substantial supervision.'
  },
  {
    score: 3,
    label: 'Developing Competence',
    description: 'Performs task with moderate supervision.'
  },
  {
    score: 4,
    label: 'Competent',
    description: 'Performs independently to acceptable workplace standards.'
  },
  {
    score: 5,
    label: 'Proficient/Expert',
    description: 'Performs independently, accurately, efficiently, and can mentor others.'
  }
]

const assessmentSchema = z.object({
  logbookEntryId: z.string().min(1, 'Logbook entry ID is required'),
  competencyScore: z.number().min(1).max(5, 'Competency score must be between 1 and 5'),
  optionalComment: z.string().optional(),
  status: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED'])
})

// GET - Fetch competency levels for UI
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      competencyLevels
    })

  } catch (error) {
    console.error('Get competency levels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update supervisor assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assessmentSchema.parse(body)

    // Get supervisor profile
    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!supervisorProfile) {
      return NextResponse.json({ error: 'Supervisor profile not found' }, { status: 404 })
    }

    // TEMPORARY: Allow supervisors to view all students for now
    // Get logbook entry without supervisor assignment check
    const logbookEntry = await prisma.logbookEntry.findFirst({
      where: {
        id: validatedData.logbookEntryId
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    if (!logbookEntry) {
      return NextResponse.json({ error: 'Logbook entry not found' }, { status: 404 })
    }

    // Get competency level details
    const competencyLevel = competencyLevels.find(level => level.score === validatedData.competencyScore)
    if (!competencyLevel) {
      return NextResponse.json({ error: 'Invalid competency score' }, { status: 400 })
    }

    // TEMPORARY: Allow supervisors to view all students for now
    // Check if assessment already exists without supervisor filter
    const existingAssessment = await prisma.supervisorComment.findFirst({
      where: {
        logbookEntryId: validatedData.logbookEntryId
      }
    })

    if (existingAssessment) {
      return NextResponse.json({ error: 'Assessment already exists for this logbook entry' }, { status: 400 })
    }

    const assessmentData = {
      competencyScore: validatedData.competencyScore,
      competencyLabel: competencyLevel.label,
      competencyDescription: competencyLevel.description,
      optionalComment: validatedData.optionalComment,
      status: validatedData.status
    }

    // Create assessment without supervisorId filter
    // TEMPORARY: Supervisors/Lecturers can view all students. Restore assignment-based filtering later if required.
    const assessment = await prisma.supervisorComment.create({
      data: {
        logbookEntryId: validatedData.logbookEntryId,
        supervisorId: supervisorProfile.id, // Keep supervisorId for tracking
        ...assessmentData
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment saved successfully',
      assessment: {
        ...assessment,
        competencyLevels
      }
    })

  } catch (error) {
    console.error('Create assessment error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

