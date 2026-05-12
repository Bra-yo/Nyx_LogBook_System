import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assessmentSchema = z.object({
  logbookEntryId: z.string().min(1, 'Logbook entry ID is required'),
  technicalScore: z.number().min(0).max(100).optional(),
  communicationScore: z.number().min(0).max(100).optional(),
  professionalismScore: z.number().min(0).max(100).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  status: z.enum(['NOT_ASSESSED', 'IN_PROGRESS', 'COMPLETED']).default('IN_PROGRESS')
})

// GET - Fetch specific assessment
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'LECTURER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { params } = context
    const { id: assessmentId } = await params

    // TEMPORARY: Lecturers can view all assessments. Restore assignment-based filtering later if required.
    const assessment = await prisma.lecturerAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        student: {
          include: {
            user: true,
            department: true
          }
        },
        logbookEntry: true
      }
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    return NextResponse.json({ assessment })

  } catch (error) {
    console.error('Get assessment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update existing assessment
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'LECTURER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assessmentSchema.parse(body)
    const { params } = context
    const { id: assessmentId } = await params

    // Get lecturer profile
    const lecturerProfile = await prisma.lecturerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!lecturerProfile) {
      return NextResponse.json({ error: 'Lecturer profile not found' }, { status: 404 })
    }

    // Check if assessment exists and belongs to this lecturer
    const existingAssessment = await prisma.lecturerAssessment.findUnique({
      where: { id: assessmentId }
    })

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Update assessment
    const updatedAssessment = await prisma.lecturerAssessment.update({
      where: { id: assessmentId },
      data: {
        technicalScore: validatedData.technicalScore,
        communicationScore: validatedData.communicationScore,
        professionalismScore: validatedData.professionalismScore,
        overallScore: validatedData.overallScore,
        feedback: validatedData.feedback,
        status: validatedData.status,
        assessedAt: validatedData.status === 'COMPLETED' ? new Date() : existingAssessment.assessedAt
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment: updatedAssessment
    })

  } catch (error) {
    console.error('Update assessment error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete assessment (optional, for completeness)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'LECTURER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { params } = context
    const { id: assessmentId } = await params

    // Check if assessment exists
    const existingAssessment = await prisma.lecturerAssessment.findUnique({
      where: { id: assessmentId }
    })

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Delete assessment
    await prisma.lecturerAssessment.delete({
      where: { id: assessmentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    })

  } catch (error) {
    console.error('Delete assessment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
