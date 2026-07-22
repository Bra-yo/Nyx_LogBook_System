import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentees = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        paymentStatus: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        registrationIdentifier: true,
        paymentStatus: true,
        accountStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, mentees });
  } catch (error) {
    console.error("Pending payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
