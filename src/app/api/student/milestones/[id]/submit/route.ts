import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Submit milestone for mentor review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Fetch milestone with entry count
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        entries: { select: { id: true } }
      }
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    // Verify learner owns this milestone
    if (milestone.learnerId !== studentProfile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate: milestone must have at least one logbook entry
    if (!milestone.entries || milestone.entries.length === 0) {
      return NextResponse.json(
        { 
          error: 'Cannot submit milestone with no logbook entries',
          message: 'Add at least one logbook entry within the milestone date range before submitting.'
        },
        { status: 400 }
      )
    }

    // Validate: milestone must be in PENDING state
    if (milestone.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot submit milestone in ${milestone.status} state` },
        { status: 400 }
      )
    }

    // Update milestone status to SUBMITTED
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: {
        status: 'SUBMITTED'
      },
      include: {
        entries: { select: { id: true } },
        mentorAssessment: { select: { id: true, status: true } },
        lecturerAssessment: { select: { id: true, status: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Milestone submitted for mentor review',
      milestone: {
        ...updatedMilestone,
        entryCount: updatedMilestone.entries.length,
        entries: undefined
      }
    })
  } catch (error) {
    console.error('Submit milestone error:', error)
    return NextResponse.json(
      { error: 'Failed to submit milestone' },
      { status: 500 }
    )
  }
}
