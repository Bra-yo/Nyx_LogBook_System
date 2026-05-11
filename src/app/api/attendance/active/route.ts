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

    // Find active attendance session
    const activeSession = await prisma.attendance.findFirst({
      where: {
        studentId: studentProfile.id,
        status: 'ACTIVE'
      },
      include: {
        officeLocation: true
      }
    })

    if (!activeSession) {
      return NextResponse.json({ hasActiveSession: false })
    }

    return NextResponse.json({
      hasActiveSession: true,
      activeSession
    })

  } catch (error) {
    console.error('Get active session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
