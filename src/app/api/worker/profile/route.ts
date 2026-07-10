import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const profileUpdateSchema = z.object({
  erpEmployeeId: z.string().trim().optional(),
  staffNumber: z.string().trim().optional(),
  department: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  employmentStatus: z.string().trim().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json(
        {
          success: true,
          worker: null,
          message:
            "Worker profile will be provisioned from ERP once synchronization is enabled.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ success: true, worker: workerProfile });
  } catch (error) {
    console.error("Worker get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const workerProfile = await prisma.workerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: "Worker profile updated successfully",
      worker: workerProfile,
    });
  } catch (error) {
    console.error("Worker update profile error:", error);
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
