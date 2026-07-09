import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertDepartment(
  code: string,
  name: string,
  description?: string,
) {
  return prisma.department.upsert({
    where: { code },
    update: { name, description },
    create: { code, name, description },
  });
}

async function upsertAdminUser({
  email,
  name,
  password,
  departmentId,
}: {
  email: string;
  name: string;
  password: string;
  departmentId: string;
}) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
      password,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name,
      email,
      password,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: {
      departmentId,
      permissions: ["ALL"],
    },
    create: {
      userId: user.id,
      departmentId,
      permissions: ["ALL"],
    },
  });
}

async function upsertSupervisorUser({
  email,
  name,
  password,
  departmentId,
  title,
  company,
}: {
  email: string;
  name: string;
  password: string;
  departmentId: string;
  title: string;
  company: string;
}) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "SUPERVISOR",
      password,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name,
      email,
      password,
      role: "SUPERVISOR",
      isActive: true,
      mustChangePassword: false,
    },
  });

  const profile = await prisma.supervisorProfile.upsert({
    where: { userId: user.id },
    update: {
      departmentId,
      title,
      company,
    },
    create: {
      userId: user.id,
      departmentId,
      title,
      company,
    },
  });

  return { user, profileId: profile.id };
}

async function upsertLecturerUser({
  email,
  name,
  password,
  departmentId,
  title,
  office,
}: {
  email: string;
  name: string;
  password: string;
  departmentId: string;
  title: string;
  office: string;
}) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "LECTURER",
      password,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name,
      email,
      password,
      role: "LECTURER",
      isActive: true,
      mustChangePassword: false,
    },
  });

  const profile = await prisma.lecturerProfile.upsert({
    where: { userId: user.id },
    update: {
      departmentId,
      title,
      office,
    },
    create: {
      userId: user.id,
      departmentId,
      title,
      office,
    },
  });

  return { user, profileId: profile.id };
}

async function upsertStudentUser({
  email,
  name,
  password,
  departmentId,
  regNumber,
  supervisorId,
  lecturerId,
  year,
  semester,
  internshipCompany,
  internshipStartDate,
  internshipEndDate,
}: {
  email: string;
  name: string;
  password: string;
  departmentId: string;
  regNumber: string;
  supervisorId?: string;
  lecturerId?: string;
  year: number;
  semester: number;
  internshipCompany?: string;
  internshipStartDate?: Date;
  internshipEndDate?: Date;
}) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "STUDENT",
      password,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name,
      email,
      password,
      role: "STUDENT",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      departmentId,
      regNumber,
      supervisorId,
      lecturerId,
      year,
      semester,
      internshipCompany,
      internshipStartDate,
      internshipEndDate,
    },
    create: {
      userId: user.id,
      departmentId,
      regNumber,
      supervisorId,
      lecturerId,
      year,
      semester,
      internshipCompany,
      internshipStartDate,
      internshipEndDate,
    },
  });

  return user;
}

async function upsertWorkerUser({
  email,
  name,
  password,
  departmentId,
  regNumber,
  supervisorId,
  lecturerId,
  year,
  semester,
  internshipCompany,
  internshipStartDate,
  internshipEndDate,
}: {
  email: string;
  name: string;
  password: string;
  departmentId: string;
  regNumber: string;
  supervisorId?: string;
  lecturerId?: string;
  year: number;
  semester: number;
  internshipCompany?: string;
  internshipStartDate?: Date;
  internshipEndDate?: Date;
}) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "WORKER",
      password,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name,
      email,
      password,
      role: "WORKER",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      departmentId,
      regNumber,
      supervisorId,
      lecturerId,
      year,
      semester,
      internshipCompany,
      internshipStartDate,
      internshipEndDate,
    },
    create: {
      userId: user.id,
      departmentId,
      regNumber,
      supervisorId,
      lecturerId,
      year,
      semester,
      internshipCompany,
      internshipStartDate,
      internshipEndDate,
    },
  });

  return user;
}

async function main() {
  console.log("🌱 Starting database seeding...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@bobgroganconsulting.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123";
  const adminName = process.env.ADMIN_NAME || "System Administrator";
  const defaultUserPassword =
    process.env.DEFAULT_USER_PASSWORD || "ChangeMe123";
  const seedDemoUsers = process.env.SEED_DEMO_USERS !== "false";
  const updateAdminFromEnv = process.env.UPDATE_ADMIN_FROM_ENV === "true";

  const departments = await Promise.all([
    upsertDepartment(
      "IT",
      "Information Technology",
      "Department of Information Technology",
    ),
    upsertDepartment(
      "CS",
      "Computer Science",
      "Department of Computer Science",
    ),
    upsertDepartment(
      "SE",
      "Software Engineering",
      "Department of Software Engineering",
    ),
    upsertDepartment(
      "BA",
      "Business Administration",
      "Department of Business Administration",
    ),
    upsertDepartment("FN", "Finance", "Department of Finance"),
    upsertDepartment(
      "HR",
      "Human Resource",
      "Department of Human Resource Management",
    ),
    upsertDepartment(
      "GD",
      "General Department",
      "General Administration Department",
    ),
  ]);

  const csDept = departments.find((dept) => dept.code === "CS");
  const adminDept = departments.find((dept) => dept.code === "GD");

  if (!csDept || !adminDept) {
    throw new Error("Required departments were not created.");
  }

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
  await upsertAdminUser({
    email: adminEmail,
    name: adminName,
    password: hashedAdminPassword,
    departmentId: adminDept.id,
  });

  if (seedDemoUsers) {
    console.log(
      "🎭 Seeding demo users for ADMIN, SUPERVISOR, LECTURER, STUDENT, and WORKER roles...",
    );

    const hashedDefaultPassword = await bcrypt.hash(defaultUserPassword, 12);

    const supervisor = await upsertSupervisorUser({
      email: "supervisor@demo.com",
      name: "Demo Supervisor",
      password: hashedDefaultPassword,
      departmentId: csDept.id,
      title: "Senior Software Engineer",
      company: "Tech Corp",
    });

    const lecturer = await upsertLecturerUser({
      email: "lecturer@demo.com",
      name: "Demo Lecturer",
      password: hashedDefaultPassword,
      departmentId: csDept.id,
      title: "Assistant Professor",
      office: "Room 101",
    });

    await upsertStudentUser({
      email: "student@demo.com",
      name: "Demo Student",
      password: hashedDefaultPassword,
      departmentId: csDept.id,
      regNumber: "CS/2023/001",
      supervisorId: supervisor.profileId,
      lecturerId: lecturer.profileId,
      year: 3,
      semester: 2,
      internshipCompany: "Tech Corp",
      internshipStartDate: new Date("2024-01-01"),
      internshipEndDate: new Date("2024-06-30"),
    });

    await upsertWorkerUser({
      email: "worker@demo.com",
      name: "Demo Worker",
      password: hashedDefaultPassword,
      departmentId: csDept.id,
      regNumber: "CS/2023/002",
      supervisorId: supervisor.profileId,
      lecturerId: lecturer.profileId,
      year: 3,
      semester: 2,
      internshipCompany: "Worker Solutions Ltd",
      internshipStartDate: new Date("2024-02-01"),
      internshipEndDate: new Date("2024-07-31"),
    });

    console.log("✅ Demo users seeded successfully");
    console.log("🔑 Default demo login credentials:");
    console.log("   Admin:     ", adminEmail, "/", adminPassword);
    console.log(
      "   Supervisor:",
      "supervisor@demo.com",
      "/",
      defaultUserPassword,
    );
    console.log(
      "   Lecturer:  ",
      "lecturer@demo.com",
      "/",
      defaultUserPassword,
    );
    console.log("   Student:   ", "student@demo.com", "/", defaultUserPassword);
    console.log("   Worker:    ", "worker@demo.com", "/", defaultUserPassword);
  } else if (updateAdminFromEnv) {
    console.log("🔄 Updating existing admin from environment...");
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedAdminPassword,
          isActive: true,
          mustChangePassword: false,
        },
      });
      console.log(`✅ Existing admin updated from environment: ${adminEmail}`);
    }
  } else {
    console.log(
      "👑 Existing admin skipped. Set UPDATE_ADMIN_FROM_ENV=true to update credentials.",
    );
  }

  console.log("✅ Database seeding completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
