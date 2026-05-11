import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return safe empty structure as specified in requirements
    return NextResponse.json({
      records: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      },
      stats: {
        totalRecords: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalHours: 0
      }
    })

  } catch (error) {
    console.error('Get admin attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
