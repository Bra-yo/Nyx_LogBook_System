import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const learningPaths = await prisma.learnerLearningPath.findMany({
      where: {
        learnerId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        competency: {
          include: { learningArea: true },
        },
        mentorAllocations: {
          where: { status: "ACTIVE" },
          include: { mentor: { include: { user: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, learningPaths });
  } catch (error) {
    console.error("Fetch active learning paths error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
