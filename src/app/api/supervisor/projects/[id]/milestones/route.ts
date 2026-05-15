import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildMentorProjectWhereClause } from '@/lib/access-control'
import { parseTaskText } from '@/lib/parse-task-text'

const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  learnerId: z.string().optional(),
  taskText: z.string().min(1, 'Please provide at least one task or deliverable'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor profile not found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        ...buildMentorProjectWhereClause(supervisor)
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createMilestoneSchema.parse(body)

    const start = new Date(validatedData.startDate)
    const end = new Date(validatedData.endDate)
    if (start >= end) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const tasks = parseTaskText(validatedData.taskText)
    if (tasks.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one task or deliverable' }, { status: 400 })
    }

    let learnerId: string | null = null
    if (validatedData.learnerId) {
      const learner = await prisma.studentProfile.findUnique({
        where: { id: validatedData.learnerId }
      })
      if (!learner) {
        return NextResponse.json({ error: 'Selected learner not found' }, { status: 400 })
      }
      learnerId = learner.id
    }

    const milestone = await prisma.milestone.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        startDate: start,
        endDate: end,
        projectId: project.id,
        mentorId: supervisor.id,
        departmentId: project.departmentId || null,
        learnerId,
        tasks: {
          create: tasks.map((task) => ({
            title: task.title,
            description: task.description,
            expectedOutput: task.expectedOutput || null
          }))
        }
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json({ success: true, milestone })
  } catch (error) {
    console.error('Failed to create project milestone:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
