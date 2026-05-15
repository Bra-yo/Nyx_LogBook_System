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

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Find current active attendance session regardless of day
    const activeSession = await prisma.attendance.findFirst({
      where: {
        studentId: studentProfile.id,
        status: 'ACTIVE'
      },
      include: {
        officeLocation: true
      }
    })

    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const todaySessions = await prisma.attendance.findMany({
      where: {
        studentId: studentProfile.id,
        checkInTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        OR: [
          { status: 'ACTIVE' },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        officeLocation: true
      },
      orderBy: {
        checkInTime: 'asc'
      }
    })

    let todayTotalHours = todaySessions.reduce((sum, session) => {
      if (session.status === 'COMPLETED' && typeof session.hoursWorked === 'number') {
        return sum + session.hoursWorked
      }
      return sum
    }, 0)

    if (activeSession) {
      const now = new Date()
      const checkInTime = new Date(activeSession.checkInTime)
      const elapsedHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
      todayTotalHours += elapsedHours
    }

    return NextResponse.json({
      hasActiveSession: Boolean(activeSession),
      hasAttendanceToday: todaySessions.length > 0,
      activeSession,
      todaySessions,
      todayTotalHours: Math.round(todayTotalHours * 100) / 100,
      canCheckIn: !activeSession,
      canCheckOut: Boolean(activeSession)
    })

  } catch (error) {
    console.error('Get active session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
