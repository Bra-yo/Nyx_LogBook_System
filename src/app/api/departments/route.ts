import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      departments
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if department with same name or code already exists
    const existingDept = await prisma.department.findFirst({
      where: {
        OR: [
          { name: name },
          { code: code }
        ]
      }
    })

    if (existingDept) {
      return NextResponse.json(
        { success: false, error: 'Department with this name or code already exists' },
        { status: 409 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description: description || null
      }
    })

    return NextResponse.json({
      success: true,
      department
    })
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
