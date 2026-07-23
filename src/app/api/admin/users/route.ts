import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRegistrationIdentifierForUser } from "@/lib/registration-identifier";
import { validateCohortForEnrollment } from "@/lib/services/cohort-management";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendRegistrationNotification } from "@/lib/services/registration-notification";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["STUDENT", "SUPERVISOR", "ADMIN"]),
  departmentId: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  office: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  organization: z.string().optional(),
  phone: z.string().optional(),
  registrationType: z.enum(["CAREER_MENTEE", "BUSINESS_MENTEE"]).optional(),
  mentorshipTrack: z.enum(["CAREER", "BUSINESS"]).optional(),
  cohortId: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  role: z
    .enum(["STUDENT", "SUPERVISOR", "LECTURER", "ADMIN", "WORKER"])
    .optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
});

// GET - Fetch users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(validatedQuery.page);
    const limit = parseInt(validatedQuery.limit);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (validatedQuery.role) {
      where.role = validatedQuery.role;
    }

    if (validatedQuery.departmentId) {
      where.OR = [
        { studentProfile: { departmentId: validatedQuery.departmentId } },
        { supervisorProfile: { departmentId: validatedQuery.departmentId } },
        { lecturerProfile: { departmentId: validatedQuery.departmentId } },
        { adminProfile: { departmentId: validatedQuery.departmentId } },
      ];
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: "insensitive" } },
        { email: { contains: validatedQuery.search, mode: "insensitive" } },
        {
          studentProfile: {
            regNumber: { contains: validatedQuery.search, mode: "insensitive" },
          },
        },
      ];
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
                  user: true,
                },
              },
              lecturer: {
                include: {
                  user: true,
                },
              },
            },
          },
          supervisorProfile: {
            include: {
              department: true,
            },
          },
          lecturerProfile: {
            include: {
              department: true,
            },
          },
          adminProfile: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPasswords = users.map((user) => ({
      ...user,
      password: undefined,
    }));

    return NextResponse.json({
      users: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    // Use default password for all admin-created users
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "ChangeMe123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const normalizedPhone = validatedData.phone?.trim()
      ? validatedData.phone.trim()
      : null;

    const fallbackDepartment = await prisma.department.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const effectiveDepartmentId =
      validatedData.departmentId || fallbackDepartment?.id || null;

    if (validatedData.role === "STUDENT" && validatedData.cohortId) {
      const cohort = await prisma.cohort.findUnique({ where: { id: validatedData.cohortId } });
      if (!cohort) {
        return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
      }

      const validationMessage = validateCohortForEnrollment({
        status: cohort.status,
        maximumCapacity: cohort.maximumCapacity,
        currentMembers: await prisma.studentProfile.count({ where: { cohortId: cohort.id } }),
      });

      if (validationMessage) {
        return NextResponse.json({ error: validationMessage }, { status: 400 });
      }
    }

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const { identifier } = await generateRegistrationIdentifierForUser(
        {
          role: validatedData.role,
          registrationType:
            validatedData.role === "STUDENT" ? validatedData.registrationType : undefined,
          mentorshipTrack:
            validatedData.role === "STUDENT" ? validatedData.mentorshipTrack : undefined,
        },
        tx as typeof tx,
      );

      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
          isActive: true,
          mustChangePassword: true, // All admin-created users must change password
          registrationIdentifier: identifier,
          phone: normalizedPhone,
          paymentStatus: validatedData.role === "STUDENT" ? "PENDING" : "PAID",
          accountStatus: validatedData.role === "STUDENT" ? "PENDING_PAYMENT" : "ACTIVE",
        },
      });

      // Create role-specific profile
      switch (validatedData.role) {
        case "STUDENT":
          if (!effectiveDepartmentId) {
            throw new Error("No department is available for student profiles");
          }
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              regNumber: `CM-${Date.now()}`,
              departmentId: effectiveDepartmentId,
              year: 1,
              semester: 1,
              internshipCompany: null,
              cohortId: validatedData.cohortId || null,
              mentorshipTrack: validatedData.mentorshipTrack || null,
            },
          });
          break;

        case "SUPERVISOR":
          if (!effectiveDepartmentId) {
            throw new Error("No department is available for supervisor profiles");
          }
          await tx.supervisorProfile.create({
            data: {
              userId: user.id,
              departmentId: effectiveDepartmentId,
              title: validatedData.title || null,
              company:
                validatedData.company || validatedData.organization || null,
            },
          });
          break;

        case "ADMIN":
          if (!effectiveDepartmentId) {
            throw new Error("No department is available for admin profiles");
          }
          await tx.adminProfile.create({
            data: {
              userId: user.id,
              departmentId: effectiveDepartmentId,
              permissions: validatedData.permissions || [],
            },
          });
          break;
      }

      return user;
    });

    // Fetch created user with profile
    const createdUser = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        studentProfile: {
          include: {
            department: true,
            cohort: { select: { name: true } },
          },
        },
        supervisorProfile: {
          include: {
            department: true,
            cohortAssignments: {
              include: { cohort: { select: { name: true } } },
            },
          },
        },
        lecturerProfile: {
          include: {
            department: true,
          },
        },
        adminProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (createdUser) {
      await sendRegistrationNotification(createdUser);
    }

    return NextResponse.json({
      success: true,
      message: `User created successfully. Default password is ${defaultPassword}. The user will be required to change it after first login.`,
      user: {
        ...createdUser,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
