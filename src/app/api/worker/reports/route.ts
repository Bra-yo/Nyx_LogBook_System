import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "WORKER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Proxy to existing attendance analytics endpoint to avoid duplicating logic
    const origin = new URL(request.url).origin;
    const analyticsUrl = `${origin}/api/attendance/analytics?${new URL(request.url).searchParams.toString()}`;
    const res = await fetch(analyticsUrl, {
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Worker reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
