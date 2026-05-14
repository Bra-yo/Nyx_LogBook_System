import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

// GET - Fetch learner's milestones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Fetch milestones available to this learner (assigned to them or their department)
    const milestones = await prisma.milestone.findMany({
      where: {
        OR: [
          { learnerId: studentProfile.id },
          {
            departmentId: studentProfile.departmentId,
            learnerId: null // Department-wide milestones
          }
        ]
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueDate: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        entries: {
          where: { studentId: studentProfile.id },
          select: {
            id: true,
            title: true,
            date: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform response
    const milestonesWithCounts = milestones.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      startDate: m.startDate,
      endDate: m.endDate,
      status: m.status,
      tasks: m.tasks,
      entryCount: m.entries.length
    }))

    return NextResponse.json({
      success: true,
      milestones: milestonesWithCounts
    })
  } catch (error) {
    console.error('Get learner milestones error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

// POST - Milestone creation disabled for learners
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Learners cannot create milestones. Please contact your mentor.' },
    { status: 403 }
  )
}
