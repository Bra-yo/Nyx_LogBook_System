import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['STUDENT', 'SUPERVISOR', 'LECTURER', 'ADMIN']),
  departmentId: z.string().optional(),
  regNumber: z.string().optional(),
  year: z.coerce.number().int().min(1, "Year must be at least 1").max(5, "Year must be at most 5").optional(),
  semester: z.coerce.number().int().min(1, "Semester must be at least 1").max(2, "Semester must be at most 2").optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  office: z.string().optional(),
  permissions: z.array(z.string()).optional()
}).refine((data) => {
  // Department is required for STUDENT, SUPERVISOR, and LECTURER roles
  if (['STUDENT', 'SUPERVISOR', 'LECTURER'].includes(data.role)) {
    return data.departmentId && data.departmentId.length > 0
  }
  return true
}, {
  message: 'Department is required for this role',
  path: ['departmentId']
}).refine((data) => {
  // Year is required for STUDENT role
  if (data.role === 'STUDENT') {
    return data.year !== undefined && data.year !== null
  }
  return true
}, {
  message: 'Year is required for student profiles',
  path: ['year']
}).refine((data) => {
  // Registration number is required for STUDENT role
  if (data.role === 'STUDENT') {
    return data.regNumber && data.regNumber.length > 0
  }
  return true
}, {
  message: 'Registration number is required for student profiles',
  path: ['regNumber']
})

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  role: z.enum(['STUDENT', 'SUPERVISOR', 'LECTURER', 'ADMIN']).optional(),
  departmentId: z.string().optional(),
  search: z.string().optional()
})

// GET - Fetch users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(validatedQuery.page)
    const limit = parseInt(validatedQuery.limit)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (validatedQuery.role) {
      where.role = validatedQuery.role
    }

    if (validatedQuery.departmentId) {
      where.OR = [
        { studentProfile: { departmentId: validatedQuery.departmentId } },
        { supervisorProfile: { departmentId: validatedQuery.departmentId } },
        { lecturerProfile: { departmentId: validatedQuery.departmentId } },
        { adminProfile: { departmentId: validatedQuery.departmentId } }
      ]
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { email: { contains: validatedQuery.search, mode: 'insensitive' } },
        { studentProfile: { regNumber: { contains: validatedQuery.search, mode: 'insensitive' } } }
      ]
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          studentProfile: {
            include: {
              department: true,
              supervisor: {
                include: {
                  user: true
                }
              },
              lecturer: {
                include: {
                  user: true
                }
              }
            }
          },
          supervisorProfile: {
            include: {
              department: true
            }
          },
          lecturerProfile: {
            include: {
              department: true
            }
          },
          adminProfile: {
            include: {
              department: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => ({
      ...user,
      password: undefined
    }))

    return NextResponse.json({
      users: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Check if registration number already exists (for students)
    if (validatedData.role === 'STUDENT' && validatedData.regNumber) {
      const existingStudent = await prisma.studentProfile.findUnique({
        where: { regNumber: validatedData.regNumber }
      })

      if (existingStudent) {
        return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 })
      }
    }

    // Use default password for all admin-created users
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'ChangeMe123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
          isActive: true,
          mustChangePassword: true // All admin-created users must change password
        }
      })

      // Create role-specific profile
      switch (validatedData.role) {
        case 'STUDENT':
          if (!validatedData.departmentId) {
            throw new Error('Department is required for student profiles')
          }
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              regNumber: validatedData.regNumber!,
              departmentId: validatedData.departmentId,
              year: validatedData.year!,
              semester: validatedData.semester || 1
            }
          })
          break

        case 'SUPERVISOR':
          if (!validatedData.departmentId) {
            throw new Error('Department is required for supervisor profiles')
          }
          await tx.supervisorProfile.create({
            data: {
              userId: user.id,
              departmentId: validatedData.departmentId,
              title: validatedData.title || null,
              company: validatedData.company || null
            }
          })
          break

        case 'LECTURER':
          if (!validatedData.departmentId) {
            throw new Error('Department is required for lecturer profiles')
          }
          await tx.lecturerProfile.create({
            data: {
              userId: user.id,
              departmentId: validatedData.departmentId,
              title: validatedData.title || null,
              office: validatedData.office || null
            }
          })
          break

        case 'ADMIN':
          if (!validatedData.departmentId) {
            throw new Error('Department is required for admin profiles')
          }
          await tx.adminProfile.create({
            data: {
              userId: user.id,
              departmentId: validatedData.departmentId,
              permissions: validatedData.permissions || []
            }
          })
          break
      }

      return user
    })

    // Fetch created user with profile
    const createdUser = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        studentProfile: {
          include: {
            department: true
          }
        },
        supervisorProfile: {
          include: {
            department: true
          }
        },
        lecturerProfile: {
          include: {
            department: true
          }
        },
        adminProfile: {
          include: {
            department: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `User created successfully. Default password is ${defaultPassword}. The user will be required to change it after first login.`,
      user: {
        ...createdUser,
        password: undefined
      }
    })

  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
