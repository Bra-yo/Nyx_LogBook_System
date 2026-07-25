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

    const targetedUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        paymentStatus: true,
        accountStatus: true,
        registrationIdentifier: true,
        studentProfile: { include: { cohort: { select: { name: true } } } },
        supervisorProfile: { include: { cohortAssignments: { include: { cohort: { select: { name: true } } } } } },
      },
    });

    let emailPayload = null;

    if (confirmation.changed) {
      try {
        emailPayload = await sendPaymentConfirmedEmail({
          id: resolvedParams.id,
          email: targetedUser?.email || confirmation.email,
          name: targetedUser?.name || confirmation.name,
          phone: targetedUser?.phone,
          role: targetedUser?.role || "STUDENT",
          registrationIdentifier: targetedUser?.registrationIdentifier,
          studentProfile: targetedUser?.studentProfile
            ? {
                mentorshipTrack: targetedUser.studentProfile.mentorshipTrack,
                cohort: targetedUser.studentProfile.cohort,
              }
            : null,
          defaultPassword: process.env.DEFAULT_USER_PASSWORD || "ChangeMe123",
        });

        if (emailPayload) {
          console.info("Payment confirmed email queued", emailPayload);
        }
      } catch (error) {
        console.error("Payment confirmation completed but final admission letter delivery failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      confirmation,
      emailQueued: Boolean(emailPayload),
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
