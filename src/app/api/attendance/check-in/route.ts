import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GeolocationService } from '@/lib/geolocation'
import { QRCodeService } from '@/lib/qr-code'
import { z } from 'zod'

const checkInSchema = z.object({
  qrCodeData: z.string(),
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
    const validatedData = checkInSchema.parse(body)

    // Parse and validate QR code data
    let qrData
    try {
      qrData = QRCodeService.parseQRCodeData(validatedData.qrCodeData)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
    }

    // Get normalized token from QR data
    const qrToken = qrData.qrCodeData || qrData.qrToken || qrData.token || qrData.officeToken || qrData.raw

    // For plain text QR codes, find matching office location by qrCodeData
    if (!qrData.isJson && qrToken.startsWith('NYX_ATTENDANCE_TEST_QR_')) {
      // Find office location that matches the QR code data exactly
      const matchingOfficeLocation = await prisma.officeLocation.findFirst({
        where: { 
          isActive: true,
          qrCodeData: qrToken 
        }
      })
      
      if (!matchingOfficeLocation) {
        return NextResponse.json({ 
          success: false,
          message: 'Invalid or unregistered attendance QR code. Please contact admin to activate this QR code.'
        }, { status: 400 })
      }
      
      // Override qrData with matching office location data
      qrData = {
        ...qrData,
        type: 'attendance',
        locationId: matchingOfficeLocation.id,
        locationName: matchingOfficeLocation.name,
        latitude: matchingOfficeLocation.latitude,
        longitude: matchingOfficeLocation.longitude,
        radius: matchingOfficeLocation.radius,
        timestamp: Date.now()
      }
    } else if (!QRCodeService.validateQRCodeData(qrData)) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid or unregistered attendance QR code. Please contact admin to activate this QR code.'
      }, { status: 400 })
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Check if student already has an active session
    const activeSession = await prisma.attendance.findFirst({
      where: {
        studentId: studentProfile.id,
        status: 'ACTIVE'
      }
    })

    if (activeSession) {
      return NextResponse.json({
        error: 'You already have an active attendance session. Please check out first.',
        activeSession: {
          id: activeSession.id,
          checkInTime: activeSession.checkInTime,
          officeLocationId: activeSession.officeLocationId
        }
      }, { status: 400 })
    }

    // Get office location
    const officeLocation = await prisma.officeLocation.findUnique({
      where: { id: qrData.locationId }
    })

    if (!officeLocation || !officeLocation.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive office location' }, { status: 400 })
    }

    // Verify user location
    const locationVerification = GeolocationService.verifyLocation(
      {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        accuracy: validatedData.accuracy,
        timestamp: Date.now()
      },
      officeLocation
    )

    if (!locationVerification.isValid) {
      return NextResponse.json({ 
        error: 'Location verification failed',
        message: locationVerification.message,
        distance: locationVerification.distance
      }, { status: 400 })
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        studentId: studentProfile.id,
        officeLocationId: officeLocation.id,
        checkInTime: new Date(),
        checkInLat: validatedData.latitude,
        checkInLng: validatedData.longitude,
        status: 'ACTIVE',
        qrCodeData: validatedData.qrCodeData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
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
      message: locationVerification.message,
      attendance
    })

  } catch (error) {
    console.error('Check-in error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
