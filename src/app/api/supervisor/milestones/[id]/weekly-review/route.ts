import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get supervisor profile
    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!supervisor) {
      return NextResponse.json({ message: 'Supervisor profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { milestoneTaskId, learnerId, weekStartDate, weekEndDate, competencyLevel, comment, status } = body

    if (!learnerId || !weekStartDate || !weekEndDate || competencyLevel === undefined) {
      return NextResponse.json(
        { message: 'Learner ID, week dates, and competency level are required' },
        { status: 400 }
      )
    }

    // Validate competency level
    if (competencyLevel < 1 || competencyLevel > 5) {
      return NextResponse.json(
        { message: 'Competency level must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(weekStartDate)
    const end = new Date(weekEndDate)
    if (start >= end) {
      return NextResponse.json(
        { message: 'Week end date must be after start date' },
        { status: 400 }
      )
    }

    // Verify milestone exists
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      select: { id: true, mentorId: true }
    })

    if (!milestone) {
      return NextResponse.json({ message: 'Milestone not found' }, { status: 404 })
    }

    if (milestone.mentorId !== supervisor.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify learner exists
    const learner = await prisma.studentProfile.findUnique({
      where: { id: learnerId },
      select: { id: true }
    })

    if (!learner) {
      return NextResponse.json({ message: 'Learner not found' }, { status: 404 })
    }

    // If milestoneTaskId is provided, verify it belongs to this milestone
    if (milestoneTaskId) {
      const task = await prisma.milestoneTask.findUnique({
        where: { id: milestoneTaskId },
        select: { milestoneId: true }
      })

      if (!task || task.milestoneId !== id) {
        return NextResponse.json(
          { message: 'Task does not belong to this milestone' },
          { status: 400 }
        )
      }
    }

    const review = await prisma.weeklyMentorTaskReview.create({
      data: {
        milestoneId: id,
        milestoneTaskId: milestoneTaskId || null,
        mentorId: supervisor.id,
        learnerId,
        weekStartDate: start,
        weekEndDate: end,
        competencyLevel,
        comment,
        status: status || 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      review
    })
  } catch (error) {
    console.error('Failed to create weekly review:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}