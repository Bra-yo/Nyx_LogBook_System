import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    // TEMPORARY: Mentors can view all milestones. Restore assignment filtering later if required.
    const milestones = await prisma.milestone.findMany({
      include: {
        learner: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        department: {
          select: { name: true }
        },
        mentor: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            entries: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      milestones
    })
  } catch (error) {
    console.error('Failed to fetch milestones:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { title, description, startDate, endDate, learnerId, departmentId } = body

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Title, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      return NextResponse.json(
        { message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate learner belongs to department if both are provided
    if (learnerId && departmentId) {
      const learner = await prisma.studentProfile.findUnique({
        where: { id: learnerId },
        select: { departmentId: true }
      })
      if (!learner || learner.departmentId !== departmentId) {
        return NextResponse.json(
          { message: 'Learner does not belong to the selected department' },
          { status: 400 }
        )
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
        mentorId: supervisor.id,
        learnerId: learnerId || null,
        departmentId: departmentId || null
      },
      include: {
        learner: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        department: {
          select: { name: true }
        },
        mentor: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      milestone
    })
  } catch (error) {
    console.error('Failed to create milestone:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}