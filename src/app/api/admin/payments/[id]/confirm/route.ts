import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmPaymentForUser, sendPaymentConfirmedEmail } from "@/lib/payment-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const confirmation = await confirmPaymentForUser(resolvedParams.id, session.user.id);

    const emailPayload = await sendPaymentConfirmedEmail(
      confirmation.email,
      confirmation.name,
    );

    if (emailPayload) {
      console.info("Payment confirmed email queued", emailPayload);
    }

    return NextResponse.json({ success: true, confirmation });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
