import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: "admin@demo.com",
        password,
        role: "ADMIN",
        isActive: true,
      },
      {
        name: "Student User",
        email: "student@demo.com",
        password,
        role: "STUDENT",
        isActive: true,
      },
      {
        name: "Lecturer User",
        email: "lecturer@demo.com",
        password,
        role: "LECTURER",
        isActive: true,
      },
      {
        name: "Supervisor User",
        email: "supervisor@demo.com",
        password,
        role: "SUPERVISOR",
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Demo users created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
