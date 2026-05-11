import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GeolocationService } from '@/lib/geolocation'
import { z } from 'zod'

const checkOutSchema = z.object({
  attendanceId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = checkOutSchema.parse(body)

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Find active attendance session
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: validatedData.attendanceId,
        studentId: studentProfile.id,
        status: 'ACTIVE'
      },
      include: {
        officeLocation: true
      }
    })

    if (!attendance) {
      return NextResponse.json({ error: 'No active attendance session found' }, { status: 404 })
    }

    // Verify user location (optional for check-out, but we'll still check)
    const locationVerification = GeolocationService.verifyLocation(
      {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        accuracy: validatedData.accuracy,
        timestamp: Date.now()
      },
      attendance.officeLocation
    )

    // Calculate hours worked
    const checkOutTime = new Date()
    const checkInTime = new Date(attendance.checkInTime)
    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) // Convert to hours

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLat: validatedData.latitude,
        checkOutLng: validatedData.longitude,
        status: 'COMPLETED',
        hoursWorked: Math.round(hoursWorked * 100) / 100 // Round to 2 decimal places
      },
      include: {
        officeLocation: true,
        student: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Checked out successfully. Hours worked: ${updatedAttendance.hoursWorked}`,
      attendance: updatedAttendance,
      locationMessage: locationVerification.message
    })

  } catch (error) {
    console.error('Check-out error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
