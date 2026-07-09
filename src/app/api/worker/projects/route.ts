import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getWorkerProfileByUserId,
  getWorkerProjectsForWorker,
} from "@/lib/api/workerServices";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workerProfile = await getWorkerProfileByUserId(session.user.id);
    if (!workerProfile)
      return NextResponse.json(
        {
          success: true,
          projects: [],
          message:
            "Worker project assignment will be enabled after ERP synchronization.",
        },
        { status: 200 },
      );

    const projects = await getWorkerProjectsForWorker(workerProfile.id);
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Worker projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
