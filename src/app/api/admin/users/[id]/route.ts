import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    if (existingUser.role === "STUDENT") {
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
    }

    if (existingUser.role === "SUPERVISOR") {
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
      // Update user
      const user = await tx.user.update({
        where: { id: resolvedParams.id },
        data: updateData,
      });

      // Update role-specific profile
      if (existingUser.role === "STUDENT") {
        const profileUpdate: any = {};
        if (validatedData.regNumber !== undefined)
          profileUpdate.regNumber = validatedData.regNumber;
        if (validatedData.departmentId !== undefined)
          profileUpdate.departmentId = validatedData.departmentId;
        if (validatedData.supervisorId !== undefined)
          profileUpdate.supervisorId = validatedData.supervisorId;
        if (validatedData.lecturerId !== undefined)
          profileUpdate.lecturerId = validatedData.lecturerId;
        if (validatedData.year !== undefined)
          profileUpdate.year = validatedData.year;
        if (validatedData.semester !== undefined)
          profileUpdate.semester = validatedData.semester;
        if (validatedData.internshipCompany !== undefined)
          profileUpdate.internshipCompany = validatedData.internshipCompany;

        await tx.studentProfile.update({
          where: { userId: resolvedParams.id },
          data: profileUpdate,
        });
      } else if (existingUser.role === "SUPERVISOR") {
        const profileUpdate: any = {};
        if (validatedData.departmentId !== undefined)
          profileUpdate.departmentId = validatedData.departmentId;
        if (validatedData.title !== undefined)
          profileUpdate.title = validatedData.title;
        if (validatedData.company !== undefined) {
          profileUpdate.company = validatedData.company;
        } else if (validatedData.organization !== undefined) {
          profileUpdate.company = validatedData.organization;
        }

        await tx.supervisorProfile.update({
          where: { userId: resolvedParams.id },
          data: profileUpdate,
        });
      } else if (existingUser.role === "LECTURER") {
        const profileUpdate: any = {};
        if (validatedData.departmentId !== undefined)
          profileUpdate.departmentId = validatedData.departmentId;
        if (validatedData.title !== undefined)
          profileUpdate.title = validatedData.title;
        if (validatedData.office !== undefined)
          profileUpdate.office = validatedData.office;

        await tx.lecturerProfile.update({
          where: { userId: resolvedParams.id },
          data: profileUpdate,
        });
      } else if (existingUser.role === "ADMIN") {
        const profileUpdate: any = {};
        if (validatedData.departmentId !== undefined)
          profileUpdate.departmentId = validatedData.departmentId;
        if (validatedData.permissions !== undefined)
          profileUpdate.permissions = validatedData.permissions;

        await tx.adminProfile.update({
          where: { userId: resolvedParams.id },
          data: profileUpdate,
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

    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
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
        message: "User has been deactivated instead of deleted",
      });
    }

    await prisma.user.delete({
      where: { id: resolvedParams.id },
    });

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
