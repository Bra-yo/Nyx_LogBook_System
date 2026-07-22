import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserPermanently } from "@/lib/admin-user-delete";
import { validateCohortForEnrollment } from "@/lib/services/cohort-management";
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
  role: z.enum(["STUDENT", "SUPERVISOR", "ADMIN"]).optional(),
  supervisorId: z.string().optional(),
  lecturerId: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  organization: z.string().optional(),
  office: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  phone: z.string().optional(),
  registrationType: z.enum(["CAREER_MENTEE", "BUSINESS_MENTEE"]).optional(),
  mentorshipTrack: z.enum(["CAREER", "BUSINESS"]).optional(),
  cohortId: z.string().optional(),
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
    const updateData: Record<string, unknown> = {
      name: validatedData.name,
      email: validatedData.email,
      isActive: validatedData.isActive,
    };

    if (validatedData.role === "STUDENT" && !existingUser.paymentStatus) {
      updateData.paymentStatus = "PENDING";
      updateData.accountStatus = "PENDING_PAYMENT";
    }

    if (validatedData.cohortId !== undefined) {
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

    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone?.trim()
        ? validatedData.phone.trim()
        : null;
    }

    if (validatedData.role) {
      updateData.role = validatedData.role;
    }

    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    const roleToUpdate = validatedData.role || existingUser.role;

    const result = await prisma.$transaction(async (tx) => {
      const resolveEffectiveDepartmentId = async () => {
        if (validatedData.departmentId) {
          return validatedData.departmentId;
        }

        const currentDepartmentId =
          existingUser.studentProfile?.departmentId ||
          existingUser.supervisorProfile?.departmentId ||
          existingUser.lecturerProfile?.departmentId ||
          existingUser.adminProfile?.departmentId;

        if (currentDepartmentId) {
          return currentDepartmentId;
        }

        const fallbackDepartment = await tx.department.findFirst({
          select: { id: true },
          orderBy: { createdAt: "asc" },
        });

        return fallbackDepartment?.id || null;
      };

      const effectiveDepartmentId = await resolveEffectiveDepartmentId();

      if (["STUDENT", "SUPERVISOR", "ADMIN"].includes(roleToUpdate) && !effectiveDepartmentId) {
        throw new Error("No department is available for this profile");
      }
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
        const resolvedDepartmentId = effectiveDepartmentId || "";
        const profileUpdate: {
          departmentId: string;
          regNumber: string;
          year: number;
          semester: number;
          internshipCompany: string | null;
          supervisorId?: string | null;
          lecturerId?: string | null;
          cohortId?: string | null;
          mentorshipTrack?: "CAREER" | "BUSINESS" | null;
        } = {
          departmentId: resolvedDepartmentId,
          regNumber: existingUser.studentProfile?.regNumber || `CM-${Date.now()}`,
          year: existingUser.studentProfile?.year || 1,
          semester: existingUser.studentProfile?.semester || 1,
          internshipCompany: existingUser.studentProfile?.internshipCompany ?? null,
        };

        if (validatedData.supervisorId !== undefined)
          profileUpdate.supervisorId = validatedData.supervisorId;
        if (validatedData.lecturerId !== undefined)
          profileUpdate.lecturerId = validatedData.lecturerId;
        if (validatedData.cohortId !== undefined)
          profileUpdate.cohortId = validatedData.cohortId;
        if (validatedData.mentorshipTrack !== undefined)
          profileUpdate.mentorshipTrack = validatedData.mentorshipTrack;

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
            cohortId: profileUpdate.cohortId,
            mentorshipTrack: profileUpdate.mentorshipTrack,
          },
          update: profileUpdate,
        });
      } else if (roleToUpdate === "SUPERVISOR") {
        const company =
          validatedData.company ??
          validatedData.organization ??
          existingUser.supervisorProfile?.company ??
          null;
        const resolvedDepartmentId = effectiveDepartmentId || "";
        const profileData: {
          departmentId: string;
          title?: string | null;
          company?: string | null;
        } = {
          departmentId: resolvedDepartmentId,
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
        const resolvedDepartmentId = effectiveDepartmentId || "";
        const profileData: {
          departmentId: string;
          title?: string | null;
          office?: string | null;
        } = {
          departmentId: resolvedDepartmentId,
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
        const resolvedDepartmentId = effectiveDepartmentId || "";
        const profileData: {
          departmentId: string;
          permissions?: string[];
        } = {
          departmentId: resolvedDepartmentId,
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
