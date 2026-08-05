import { NextRequest, NextResponse } from "next/server";
import { authorizeCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter your email and password." },
        { status: 400 },
      );
    }

    try {
      const user = await authorizeCredentials({ email, password });
      return NextResponse.json({ success: !!user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 },
    );
  }
}
