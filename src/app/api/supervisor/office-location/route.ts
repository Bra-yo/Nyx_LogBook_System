import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BRANDING } from '@/lib/branding'
import { z, ZodError } from 'zod'

const officeLocationSchema = z.object({
  name: z.string().min(1, 'Office name is required'),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().min(20).max(10000).default(500)
})

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

    const officeLocation = await prisma.officeLocation.findFirst({
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

    return NextResponse.json({
      success: true,
      location: officeLocation ?? null
    })
  } catch (error) {
    console.error('Failed to fetch mentor office location:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreateOrUpdate(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!supervisor) {
      return NextResponse.json({ message: 'Supervisor profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = officeLocationSchema.parse(body)

    const existingOfficeLocation = await prisma.officeLocation.findFirst({
      where: {
        mentorId: supervisor.id,
        isActive: true
      }
    })

    const qrCodeData = existingOfficeLocation
      ? existingOfficeLocation.qrCodeData
      : `${BRANDING.qrPrefix}_${supervisor.id}_${crypto.randomUUID()}`

    const location = existingOfficeLocation
      ? await prisma.officeLocation.update({
          where: { id: existingOfficeLocation.id },
          data: {
            name: data.name,
            address: data.address ?? '',
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
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
      : await prisma.officeLocation.create({
          data: {
            name: data.name,
            address: data.address ?? '',
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            isActive: true,
            qrCodeData,
            mentorId: supervisor.id
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

    return NextResponse.json({ success: true, location })
  } catch (error) {
    console.error('Failed to save mentor office location:', error)

    if (error instanceof ZodError) {
      return NextResponse.json({
        message: 'Invalid office location data',
        issues: error.issues
      }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handleCreateOrUpdate(request)
}

export async function PUT(request: NextRequest) {
  return handleCreateOrUpdate(request)
}
