import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Find office location owned by this mentor
    let officeLocation = await prisma.officeLocation.findFirst({
      where: {
        mentorId: supervisor.id,
        isActive: true
      },
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    // TODO: Use mentor-owned office location once onboarding is complete.
    // For now, fallback to first active location if mentor ownership is not implemented yet
    if (!officeLocation) {
      officeLocation = await prisma.officeLocation.findFirst({
        where: {
          isActive: true
        },
        include: {
          mentor: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      })
    }

    if (!officeLocation) {
      return NextResponse.json({ message: 'No office location found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      location: officeLocation
    })
  } catch (error) {
    console.error('Failed to fetch mentor office location:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}