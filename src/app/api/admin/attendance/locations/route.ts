import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const officeLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().refine(val => val >= -90 && val <= 90, 'Latitude must be between -90 and 90'),
  longitude: z.number().refine(val => val >= -180 && val <= 180, 'Longitude must be between -180 and 180'),
  radius: z.number().min(1, 'Radius must be at least 1 meter'),
  qrCodeData: z.string().min(1, 'QR Code Data is required'),
  isActive: z.boolean().default(true)
})

// GET - Fetch all office locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['ADMIN', 'LECTURER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locations = await prisma.officeLocation.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      locations: locations
    })

  } catch (error) {
    console.error('Get office locations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new office location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = officeLocationSchema.parse(body)

    // Check if QR code data already exists
    const existingLocation = await prisma.officeLocation.findFirst({
      where: {
        qrCodeData: validatedData.qrCodeData
      }
    })

    if (existingLocation) {
      return NextResponse.json({ 
        error: 'QR Code Data already exists. Please use a unique value.' 
      }, { status: 400 })
    }

    const location = await prisma.officeLocation.create({
      data: {
        name: validatedData.name,
        address: validatedData.address,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        radius: validatedData.radius,
        qrCodeData: validatedData.qrCodeData,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Office location created successfully',
      location
    })

  } catch (error) {
    console.error('Create office location error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
