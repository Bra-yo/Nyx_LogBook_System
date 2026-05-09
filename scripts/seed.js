const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  try {
    // Create demo users
    const demoUsers = [
      {
        email: 'student@demo.com',
        name: 'Demo Student',
        password: 'password',
        role: 'STUDENT',
        isActive: true,
      },
      {
        email: 'supervisor@demo.com',
        name: 'Demo Supervisor',
        password: 'password',
        role: 'SUPERVISOR',
        isActive: true,
      },
      {
        email: 'lecturer@demo.com',
        name: 'Demo Lecturer',
        password: 'password',
        role: 'LECTURER',
        isActive: true,
      },
      {
        email: 'admin@demo.com',
        name: 'Demo Admin',
        password: 'password',
        role: 'ADMIN',
        isActive: true,
      },
    ];

    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      const createdUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role,
          isActive: user.isActive,
        },
      });

      console.log(`Created ${user.role} user: ${user.email}`);

      // Create corresponding profile based on role
      try {
        switch (user.role) {
          case 'STUDENT':
            await prisma.studentProfile.upsert({
              where: { userId: createdUser.id },
              update: {},
              create: {
                userId: createdUser.id,
                studentId: `STU${Date.now()}`,
                department: 'Computer Science',
                internshipCompany: 'Demo Company',
                internshipStartDate: new Date(),
                internshipEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              },
            });
            break;
          
          case 'SUPERVISOR':
            await prisma.supervisorProfile.upsert({
              where: { userId: createdUser.id },
              update: {},
              create: {
                userId: createdUser.id,
                employeeId: `SUP${Date.now()}`,
                department: 'Computer Science',
                specialization: 'Software Development',
                maxStudents: 10,
              },
            });
            break;
          
          case 'LECTURER':
            await prisma.lecturerProfile.upsert({
              where: { userId: createdUser.id },
              update: {},
              create: {
                userId: createdUser.id,
                employeeId: `LEC${Date.now()}`,
                department: 'Computer Science',
                courses: ['Software Engineering', 'Database Systems'],
                officeLocation: 'Room 101',
              },
            });
            break;
          
          case 'ADMIN':
            await prisma.adminProfile.upsert({
              where: { userId: createdUser.id },
              update: {},
              create: {
                userId: createdUser.id,
                employeeId: `ADM${Date.now()}`,
                department: 'IT Administration',
                permissions: ['USER_MANAGEMENT', 'SYSTEM_ADMIN', 'REPORTS'],
              },
            });
            break;
        }
        console.log(`Created ${user.role} profile`);
      } catch (profileError) {
        console.log(`Profile creation failed for ${user.email}:`, profileError.message);
      }
    }

    // Create a demo department
    try {
      await prisma.department.upsert({
        where: { id: 'cs-dept' },
        update: {},
        create: {
          id: 'cs-dept',
          name: 'Computer Science',
          description: 'Department of Computer Science and Engineering',
          head: 'Dr. John Doe',
        },
      });
      console.log('Created demo department');
    } catch (deptError) {
      console.log('Department creation failed:', deptError.message);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
