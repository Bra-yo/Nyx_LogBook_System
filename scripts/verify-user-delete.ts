import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { deleteUserPermanently } from "../src/lib/admin-user-delete";

const prisma = new PrismaClient();
const suffix = `${Date.now()}`;

type Role = "ADMIN" | "SUPERVISOR" | "LECTURER" | "STUDENT" | "WORKER";

async function ensureDepartment() {
  const existing = await prisma.department.findFirst();
  if (existing) return existing;

  return prisma.department.create({
    data: {
      name: `Verify Dept ${suffix}`,
      code: `V${suffix}`,
      description: "Temporary department for deletion verification",
    },
  });
}

async function createUserWithRole(role: Role) {
  const department = await ensureDepartment();
  const email = `${role.toLowerCase()}-${suffix}@verify.local`;
  const user = await prisma.user.create({
    data: {
      email,
      name: `${role} Verify`,
      password: await bcrypt.hash("password123", 12),
      role,
      isActive: true,
      mustChangePassword: false,
    },
  });

  if (role === "ADMIN") {
    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        departmentId: department.id,
        permissions: [],
      },
    });
  } else if (role === "SUPERVISOR") {
    const supervisorProfile = await prisma.supervisorProfile.create({
      data: {
        userId: user.id,
        departmentId: department.id,
        title: "Test Supervisor",
        company: "Verify Co",
      },
    });

    await prisma.officeLocation.create({
      data: {
        name: `Office ${suffix}`,
        address: "Verify",
        latitude: 1,
        longitude: 2,
        radius: 10,
        qrCodeData: `verify-office-${suffix}`,
        mentorId: supervisorProfile.id,
      },
    });
  } else if (role === "LECTURER") {
    await prisma.lecturerProfile.create({
      data: {
        userId: user.id,
        departmentId: department.id,
        title: "Test Lecturer",
        office: "Room 1",
      },
    });
  } else if (role === "STUDENT") {
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        departmentId: department.id,
        regNumber: `REG${suffix}`,
        year: 3,
        semester: 1,
      },
    });
  } else if (role === "WORKER") {
    await prisma.workerProfile.create({
      data: {
        userId: user.id,
        fullName: `${role} Verify`,
        department: department.name,
        jobTitle: "Verifier",
      },
    });
  }

  return user;
}

async function verifyRole(role: Role) {
  const user = await createUserWithRole(role);
  await prisma.$transaction(
    async (tx) => {
      await deleteUserPermanently(tx, user.id, role);
    },
    { timeout: 30000 },
  );

  const deleted = await prisma.user.findUnique({ where: { id: user.id } });
  if (deleted) {
    throw new Error(`${role} user still exists after deletion`);
  }

  console.log(`${role}: deleted successfully`);
}

async function main() {
  for (const role of [
    "ADMIN",
    "SUPERVISOR",
    "LECTURER",
    "STUDENT",
    "WORKER",
  ] as Role[]) {
    await verifyRole(role);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
