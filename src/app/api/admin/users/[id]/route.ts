import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserPermanently } from "@/lib/admin-user-delete";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().optional(),
  role: z
    .enum(["STUDENT", "SUPERVISOR", "LECTURER", "ADMIN", "WORKER"])
    .optional(),
  supervisorId: z.string().optional(),
  lecturerId: z.string().optional(),
  regNumber: z.string().optional(),
  year: z.number().optional(),
  semester: z.number().optional(),
  internshipCompany: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  organization: z.string().optional(),
  office: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

// GET - Fetch single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      include: {
        studentProfile: true,
        supervisorProfile: true,
        lecturerProfile: true,
        adminProfile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email already exists (if changing email)
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name: validatedData.name,
      email: validatedData.email,
      isActive: validatedData.isActive,
    };

    if (validatedData.role) {
      updateData.role = validatedData.role;
    }

    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    const roleToUpdate = validatedData.role || existingUser.role;

    if (["STUDENT", "SUPERVISOR", "LECTURER", "ADMIN"].includes(roleToUpdate)) {
      const currentDepartmentId =
        existingUser.studentProfile?.departmentId ||
        existingUser.supervisorProfile?.departmentId ||
        existingUser.lecturerProfile?.departmentId ||
        existingUser.adminProfile?.departmentId;

      if (!validatedData.departmentId && !currentDepartmentId) {
        return NextResponse.json(
          { error: "Department is required for this role" },
          { status: 400 },
        );
      }
    }

    if (roleToUpdate === "STUDENT") {
      const currentInternshipCompany =
        existingUser.studentProfile?.internshipCompany;
      const incomingInternshipCompany = validatedData.internshipCompany;

      if (
        (incomingInternshipCompany === undefined ||
          incomingInternshipCompany === "") &&
        !currentInternshipCompany
      ) {
        return NextResponse.json(
          { error: "Internship company is required for student profiles" },
          { status: 400 },
        );
      }

      if (
        (validatedData.regNumber === undefined ||
          validatedData.regNumber === "") &&
        !existingUser.studentProfile?.regNumber
      ) {
        return NextResponse.json(
          { error: "Registration number is required for student profiles" },
          { status: 400 },
        );
      }

      if (
        validatedData.year === undefined &&
        existingUser.studentProfile?.year === undefined
      ) {
        return NextResponse.json(
          { error: "Year is required for student profiles" },
          { status: 400 },
        );
      }

      if (
        validatedData.semester === undefined &&
        existingUser.studentProfile?.semester === undefined
      ) {
        return NextResponse.json(
          { error: "Semester is required for student profiles" },
          { status: 400 },
        );
      }
    }

    if (roleToUpdate === "SUPERVISOR") {
      const currentCompany = existingUser.supervisorProfile?.company;
      const incomingCompany =
        validatedData.company ?? validatedData.organization;

      if (
        (incomingCompany === undefined || incomingCompany === "") &&
        !currentCompany
      ) {
        return NextResponse.json(
          { error: "Company is required for supervisor profiles" },
          { status: 400 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete stale profile data when role changes
      if (validatedData.role && validatedData.role !== existingUser.role) {
        switch (existingUser.role) {
          case "STUDENT":
            await tx.studentProfile.deleteMany({
              where: { userId: resolvedParams.id },
            });
            break;
          case "SUPERVISOR":
            await tx.supervisorProfile.deleteMany({
              where: { userId: resolvedParams.id },
            });
            break;
          case "LECTURER":
            await tx.lecturerProfile.deleteMany({
              where: { userId: resolvedParams.id },
            });
            break;
          case "ADMIN":
            await tx.adminProfile.deleteMany({
              where: { userId: resolvedParams.id },
            });
            break;
        }
      }

      // Update user
      const user = await tx.user.update({
        where: { id: resolvedParams.id },
        data: updateData,
      });

      // Update or create role-specific profile
      if (roleToUpdate === "STUDENT") {
        const profileUpdate: any = {
          departmentId:
            validatedData.departmentId ??
            existingUser.studentProfile?.departmentId,
          regNumber:
            validatedData.regNumber ?? existingUser.studentProfile?.regNumber,
          year: validatedData.year ?? existingUser.studentProfile?.year,
          semester:
            validatedData.semester ?? existingUser.studentProfile?.semester,
          internshipCompany:
            validatedData.internshipCompany ??
            existingUser.studentProfile?.internshipCompany ??
            null,
        };

        if (validatedData.supervisorId !== undefined)
          profileUpdate.supervisorId = validatedData.supervisorId;
        if (validatedData.lecturerId !== undefined)
          profileUpdate.lecturerId = validatedData.lecturerId;

        await tx.studentProfile.upsert({
          where: { userId: resolvedParams.id },
          create: {
            userId: resolvedParams.id,
            departmentId: profileUpdate.departmentId || "",
            regNumber: profileUpdate.regNumber || "",
            year: profileUpdate.year || 1,
            semester: profileUpdate.semester || 1,
            internshipCompany: profileUpdate.internshipCompany,
            supervisorId: profileUpdate.supervisorId,
            lecturerId: profileUpdate.lecturerId,
          },
          update: profileUpdate,
        });
      } else if (roleToUpdate === "SUPERVISOR") {
        const company =
          validatedData.company ??
          validatedData.organization ??
          existingUser.supervisorProfile?.company ??
          null;
        const profileData: any = {
          departmentId:
            validatedData.departmentId ??
            existingUser.supervisorProfile?.departmentId,
          title: validatedData.title ?? existingUser.supervisorProfile?.title,
          company,
        };

        await tx.supervisorProfile.upsert({
          where: { userId: resolvedParams.id },
          create: {
            userId: resolvedParams.id,
            departmentId: profileData.departmentId || "",
            title: profileData.title ?? null,
            company: profileData.company,
          },
          update: profileData,
        });
      } else if (roleToUpdate === "LECTURER") {
        const profileData: any = {
          departmentId:
            validatedData.departmentId ??
            existingUser.lecturerProfile?.departmentId,
          title: validatedData.title ?? existingUser.lecturerProfile?.title,
          office: validatedData.office ?? existingUser.lecturerProfile?.office,
        };

        await tx.lecturerProfile.upsert({
          where: { userId: resolvedParams.id },
          create: {
            userId: resolvedParams.id,
            departmentId: profileData.departmentId || "",
            title: profileData.title ?? null,
            office: profileData.office ?? null,
          },
          update: profileData,
        });
      } else if (roleToUpdate === "ADMIN") {
        const profileData: any = {
          departmentId:
            validatedData.departmentId ??
            existingUser.adminProfile?.departmentId,
          permissions:
            validatedData.permissions ?? existingUser.adminProfile?.permissions,
        };

        await tx.adminProfile.upsert({
          where: { userId: resolvedParams.id },
          create: {
            userId: resolvedParams.id,
            departmentId: profileData.departmentId || "",
            permissions: profileData.permissions || [],
          },
          update: profileData,
        });
      }

      return user;
    });

    // Fetch updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: result.id },
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
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        ...updatedUser,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
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

// DELETE - Soft delete / deactivate user by default
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get("action") ?? "deactivate";
    const permanent = action === "permanent";

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      include: {
        studentProfile: true,
        supervisorProfile: true,
        lecturerProfile: true,
        adminProfile: true,
        workerProfile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion or self-deactivation
    if (resolvedParams.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete or deactivate your own account" },
        { status: 400 },
      );
    }

    if (existingUser.role === "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            error: "Cannot deactivate or delete the last active administrator",
          },
          { status: 400 },
        );
      }
    }

    if (!permanent) {
      await prisma.user.update({
        where: { id: resolvedParams.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "User has been deactivated",
      });
    }

    await prisma.$transaction(
      async (tx) => {
        await deleteUserPermanently(tx, resolvedParams.id, existingUser.role, {
          id: existingUser.id,
          role: existingUser.role,
          studentProfile: existingUser.studentProfile,
          supervisorProfile: existingUser.supervisorProfile,
          lecturerProfile: existingUser.lecturerProfile,
          adminProfile: existingUser.adminProfile,
          workerProfile: existingUser.workerProfile,
        });
      },
      { timeout: 30000 },
    );

    return NextResponse.json({
      success: true,
      message: "User deleted permanently",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
