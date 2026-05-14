import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
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
          include: {
            entries: {
              include: {
                student: {
                  include: {
                    user: {
                      select: { name: true }
                    }
                  }
                }
              },
              orderBy: {
                date: 'desc'
              }
            },
            weeklyReviews: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!milestone) {
      return NextResponse.json({ message: 'Milestone not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      milestone
    })
  } catch (error) {
    console.error('Failed to fetch milestone:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
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

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
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
    console.error('Failed to update milestone:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await prisma.milestone.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete milestone:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}