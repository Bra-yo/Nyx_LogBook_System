import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch individual milestone with its entries
export async function GET(
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

    // Fetch milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            status: true,
            submittedAt: true
          }
        },
        mentorAssessment: {
          select: {
            id: true,
            status: true,
            competencyLevel: true,
            comment: true,
            mentor: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        lecturerAssessment: {
          select: {
            id: true,
            status: true,
            technicalScore: true,
            communicationScore: true,
            professionalismScore: true,
            overallScore: true,
            feedback: true,
            lecturer: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    // Verify learner owns this milestone
    if (milestone.learnerId !== studentProfile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      milestone: {
        ...milestone,
        entryCount: milestone.entries.length
      }
    })
  } catch (error) {
    console.error('Get milestone error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

// PUT - Update milestone (before submission only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Fetch milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id }
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    // Verify learner owns this milestone
    if (milestone.learnerId !== studentProfile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow updates if milestone is in PENDING state
    if (milestone.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only edit milestones in PENDING status' },
        { status: 400 }
      )
    }

    // Update milestone
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: {
        title: body.title ?? milestone.title,
        description: body.description ?? milestone.description,
        startDate: body.startDate ? new Date(body.startDate) : milestone.startDate,
        endDate: body.endDate ? new Date(body.endDate) : milestone.endDate,
      },
      include: {
        entries: { select: { id: true } },
        mentorAssessment: { select: { id: true, status: true } },
        lecturerAssessment: { select: { id: true, status: true } }
      }
    })

    return NextResponse.json({
      success: true,
      milestone: {
        ...updatedMilestone,
        entryCount: updatedMilestone.entries.length,
        entries: undefined
      }
    })
  } catch (error) {
    console.error('Update milestone error:', error)
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}
