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

    // Verify milestone exists and belongs to this supervisor
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      select: { mentorId: true }
    })

    if (!milestone) {
      return NextResponse.json({ message: 'Milestone not found' }, { status: 404 })
    }

    // Get supervisor profile
    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!supervisor || milestone.mentorId !== supervisor.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, expectedOutput, dueDate } = body

    if (!title) {
      return NextResponse.json(
        { message: 'Task title is required' },
        { status: 400 }
      )
    }

    const task = await prisma.milestoneTask.create({
      data: {
        milestoneId: id,
        title,
        description,
        expectedOutput,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    return NextResponse.json({
      success: true,
      task
    })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}