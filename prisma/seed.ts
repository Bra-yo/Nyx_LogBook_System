import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Environment variables for bootstrap admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nyxquant.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123'
  const adminName = process.env.ADMIN_NAME || 'System Administrator'
  const defaultUserPassword = process.env.DEFAULT_USER_PASSWORD || 'ChangeMe123'
  const seedDemoUsers = process.env.SEED_DEMO_USERS === 'true'
  const updateAdminFromEnv = process.env.UPDATE_ADMIN_FROM_ENV === 'true'

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!existingAdmin) {
      console.log('👑 Creating bootstrap admin user...')
      
      // Create default departments if none exist
      const existingDepartments = await prisma.department.count()
      if (existingDepartments === 0) {
        const defaultDepartments = [
          { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
          { name: 'Computer Science', code: 'CS', description: 'Department of Computer Science' },
          { name: 'Software Engineering', code: 'SE', description: 'Department of Software Engineering' },
          { name: 'Business Administration', code: 'BA', description: 'Department of Business Administration' },
          { name: 'Finance', code: 'FN', description: 'Department of Finance' },
          { name: 'Human Resource', code: 'HR', description: 'Department of Human Resource Management' },
          { name: 'General Department', code: 'GD', description: 'General Administration Department' }
        ]

        for (const dept of defaultDepartments) {
          await prisma.department.create({
            data: dept
          })
        }
        console.log('📚 Created default departments')
      } else {
        console.log('📚 Departments already exist, skipping default department seed')
      }

      let department = await prisma.department.findFirst()
      if (!department) {
        department = await prisma.department.findFirst()
      }

      // Create bootstrap admin
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      const admin = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false, // Bootstrap admin doesn't need to change password
          adminProfile: {
            create: {
              departmentId: department.id,
              permissions: ['ALL']
            }
          }
        },
        include: {
          adminProfile: true
        }
      })

      console.log(`✅ Bootstrap admin created: ${admin.email}`)
      console.log(`🔑 Bootstrap admin ready`)
    } else if (updateAdminFromEnv) {
      console.log('🔄 Updating existing admin from environment...')
      
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          isActive: true,
          mustChangePassword: false
        }
      })

      console.log(`✅ Existing admin updated from environment: ${updatedAdmin.email}`)
    } else {
      console.log('👑 Existing admin skipped. Set UPDATE_ADMIN_FROM_ENV=true to update credentials.')
    }

    // Only create demo users if explicitly enabled
    if (seedDemoUsers) {
      console.log('🎭 Creating demo users...')
      
      // Get or create departments for demo
      const csDept = await prisma.department.findUnique({ where: { code: 'CS' } })
      
      // Create demo supervisor
      const supervisorPassword = await bcrypt.hash(defaultUserPassword, 12)
      const demoSupervisor = await prisma.user.upsert({
        where: { email: 'supervisor@demo.com' },
        update: {},
        create: {
          name: 'Demo Supervisor',
          email: 'supervisor@demo.com',
          password: supervisorPassword,
          role: 'SUPERVISOR',
          isActive: true,
          // // mustChangePassword: false, // Demo users don't need to change password
          supervisorProfile: {
            create: {
              departmentId: csDept!.id,
              title: 'Senior Software Engineer',
              company: 'Tech Corp'
            }
          }
        }
      })

      // Create demo lecturer
      const lecturerPassword = await bcrypt.hash(defaultUserPassword, 12)
      const demoLecturer = await prisma.user.upsert({
        where: { email: 'lecturer@demo.com' },
        update: {},
        create: {
          name: 'Demo Lecturer',
          email: 'lecturer@demo.com',
          password: lecturerPassword,
          role: 'LECTURER',
          isActive: true,
          // mustChangePassword: false,
          lecturerProfile: {
            create: {
              departmentId: csDept!.id,
              title: 'Assistant Professor',
              office: 'Room 101'
            }
          }
        }
      })

      // Create demo student
      const studentPassword = await bcrypt.hash(defaultUserPassword, 12)
      const demoStudent = await prisma.user.upsert({
        where: { email: 'student@demo.com' },
        update: {},
        create: {
          name: 'Demo Student',
          email: 'student@demo.com',
          password: studentPassword,
          role: 'STUDENT',
          isActive: true,
          // mustChangePassword: false,
          studentProfile: {
            create: {
              regNumber: 'CS/2023/001',
              departmentId: csDept!.id,
              supervisorId: demoSupervisor.id,
              lecturerId: demoLecturer.id,
              year: 3,
              semester: 2,
              internshipCompany: 'Tech Corp',
              internshipStartDate: new Date('2024-01-01'),
              internshipEndDate: new Date('2024-06-30')
            }
          }
        }
      })

      console.log('✅ Demo users created successfully')
    } else {
      console.log('🚫 Demo user creation skipped (SEED_DEMO_USERS != true)')
    }

    // Office location seeding temporarily removed to focus on core bootstrap functionality

    console.log('✅ Database seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
