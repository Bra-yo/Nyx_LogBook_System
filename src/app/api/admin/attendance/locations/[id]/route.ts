import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'LECTURER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const location = await prisma.officeLocation.findUnique({
      where: { id },
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

    if (!location) {
      return NextResponse.json({ error: 'Office location not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      location
    })
  } catch (error) {
    console.error('Get office location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}