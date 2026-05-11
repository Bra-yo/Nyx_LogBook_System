import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedAttendanceData() {
  try {
    console.log('Seeding attendance data...')

    // Create office locations
    const office1 = await prisma.officeLocation.upsert({
      where: { id: 'office-1' },
      update: {},
      create: {
        id: 'office-1',
        name: 'NYX Office Main',
        address: '123 Tech Street, Nairobi, Kenya',
        latitude: -1.2921,
        longitude: 36.8219,
        radius: 100,
        isActive: true,
        qrCodeData: JSON.stringify({
          type: 'attendance',
          locationId: 'office-1',
          locationName: 'NYX Office Main',
          latitude: -1.2921,
          longitude: 36.8219,
          radius: 100,
          timestamp: Date.now()
        })
      }
    })

    const office2 = await prisma.officeLocation.upsert({
      where: { id: 'office-2' },
      update: {},
      create: {
        id: 'office-2',
        name: 'NYX Office Annex',
        address: '456 Innovation Road, Nairobi, Kenya',
        latitude: -1.2951,
        longitude: 36.8259,
        radius: 100,
        isActive: true,
        qrCodeData: JSON.stringify({
          type: 'attendance',
          locationId: 'office-2',
          locationName: 'NYX Office Annex',
          latitude: -1.2951,
          longitude: 36.8259,
          radius: 100,
          timestamp: Date.now()
        })
      }
    })

    console.log('✅ Office locations created successfully')
    console.log('📍 Office 1:', office1.name)
    console.log('📍 Office 2:', office2.name)

    // Create sample attendance records
    const studentProfile = await prisma.studentProfile.findFirst()
    if (studentProfile) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const today = new Date()
      today.setHours(9, 0, 0, 0)
      
      const checkOutTime = new Date(today)
      checkOutTime.setHours(17, 0, 0, 0)

      await prisma.attendance.upsert({
        where: { id: 'sample-attendance-1' },
        update: {},
        create: {
          id: 'sample-attendance-1',
          studentId: studentProfile.id,
          officeLocationId: office1.id,
          checkInTime: today,
          checkOutTime: checkOutTime,
          checkInLat: -1.2921,
          checkInLng: 36.8219,
          checkOutLat: -1.2921,
          checkOutLng: 36.8219,
          status: 'COMPLETED',
          hoursWorked: 8.0,
          qrCodeData: office1.qrCodeData,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      console.log('✅ Sample attendance record created')
    }

    console.log('🎉 Attendance data seeding completed!')

  } catch (error) {
    console.error('❌ Error seeding attendance data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedAttendanceData()
  .catch((error) => {
    console.error('❌ Failed to seed attendance data:', error)
    process.exit(1)
  })
