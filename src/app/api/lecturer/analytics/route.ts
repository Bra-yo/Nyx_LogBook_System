import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['ADMIN', 'LECTURER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TEMPORARY: Lecturers can view all students. Restore assignment-based filtering later if required.
    // Get overall statistics
    const [
      totalStudents,
      totalAssessments,
      pendingAssessments,
      completedAssessments,
      averageScore
    ] = await Promise.all([
      // Total students
      prisma.studentProfile.count({
        where: {}
      }),
      
      // Total assessments
      prisma.lecturerAssessment.count({
        where: {}
      }),
      
      // Pending assessments
      prisma.lecturerAssessment.count({
        where: {
          status: 'NOT_ASSESSED'
        }
      }),
      
      // Completed assessments
      prisma.lecturerAssessment.count({
        where: {
          status: 'COMPLETED'
        }
      }),
      
      // Average score
      prisma.lecturerAssessment.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _avg: {
          overallScore: true
        }
      })
    ])

    const analytics = {
      overview: {
        totalStudents: totalStudents || 0,
        totalAssessments: totalAssessments || 0,
        pendingAssessments: pendingAssessments || 0,
        completedAssessments: completedAssessments || 0,
        averageScore: Math.round((averageScore._avg.overallScore || 0) * 100) / 100
      }
    }

    return NextResponse.json({
      success: true,
      ...analytics
    })

  } catch (error) {
    console.error('Get lecturer analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
