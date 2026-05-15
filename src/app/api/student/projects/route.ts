import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        department: true,
        user: true
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const projectAssignments = await prisma.projectLearner.findMany({
      where: { learnerId: studentProfile.id },
      include: {
        project: {
          include: {
            milestones: {
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
                }
              },
              orderBy: {
                startDate: 'desc'
              }
            }
          }
        }
      }
    })

    const projects = projectAssignments.map((assignment) => ({
      id: assignment.project.id,
      title: assignment.project.title,
      description: assignment.project.description,
      companyName: assignment.project.companyName,
      departmentId: assignment.project.departmentId,
      status: assignment.project.status,
      milestones: assignment.project.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        startDate: milestone.startDate,
        endDate: milestone.endDate,
        status: milestone.status,
        tasks: milestone.tasks
      }))
    }))

    return NextResponse.json({ success: true, projects })
  } catch (error) {
    console.error('Failed to fetch learner projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
