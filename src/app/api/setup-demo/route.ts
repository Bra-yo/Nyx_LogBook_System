import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('Creating demo users...');

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

    const results = [];
    
    for (const user of demoUsers) {
      try {
        const createdUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            password: user.password, // Temporarily use plain password for testing
            role: user.role,
            isActive: user.isActive,
          },
        });

        console.log(`Created ${user.role} user: ${user.email}`);
        results.push({ email: user.email, role: user.role, status: 'created' });

        // Create corresponding profile based on role
        try {
          switch (user.role) {
            case 'STUDENT':
              await prisma.studentProfile.create({
                data: {
                  userId: createdUser.id,
                  regNumber: `REG${Date.now()}`,
                  studentId: `STU${Date.now()}`,
                  department: 'Computer Science',
                  internshipCompany: 'Demo Company',
                  internshipStartDate: new Date(),
                  internshipEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                },
              });
              break;
            
            case 'SUPERVISOR':
              await prisma.supervisorProfile.create({
                data: {
                  userId: createdUser.id,
                  employeeId: `SUP${Date.now()}`,
                  department: 'Computer Science',
                  specialization: 'Software Development',
                  maxStudents: 10,
                },
              });
              break;
            
            case 'LECTURER':
              await prisma.lecturerProfile.create({
                data: {
                  userId: createdUser.id,
                  employeeId: `LEC${Date.now()}`,
                  department: 'Computer Science',
                  courses: 'Software Engineering, Database Systems',
                  officeLocation: 'Room 101',
                },
              });
              break;
            
            case 'ADMIN':
              await prisma.adminProfile.create({
                data: {
                  userId: createdUser.id,
                  employeeId: `ADM${Date.now()}`,
                  departmentId: 'cs-dept',
                  permissions: 'USER_MANAGEMENT,SYSTEM_ADMIN,REPORTS',
                },
              });
              break;
          }
          console.log(`Created ${user.role} profile`);
        } catch (profileError) {
          console.log(`Profile creation failed for ${user.email}:`, profileError);
        }
      } catch (userError) {
        console.log(`User creation failed for ${user.email}:`, userError);
        results.push({ email: user.email, role: user.role, status: 'failed', error: userError.message });
      }
    }

    // Create a demo department
    try {
      await prisma.department.create({
        data: {
          id: 'cs-dept',
          name: 'Computer Science',
          description: 'Department of Computer Science and Engineering',
          head: 'Dr. John Doe',
        },
      });
      console.log('Created demo department');
    } catch (deptError) {
      console.log('Department creation failed:', deptError);
    }

    console.log('Demo users setup completed!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Demo users created successfully',
      results 
    });
    
  } catch (error) {
    console.error('Setup failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
