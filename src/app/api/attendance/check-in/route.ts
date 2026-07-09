import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeolocationService } from "@/lib/geolocation";
import { QRCodeService } from "@/lib/qr-code";
import { z } from "zod";

const checkInSchema = z
  .object({
    qrCodeData: z.string().optional(),
    qrData: z.string().optional(),
    scannedData: z.string().optional(),
    code: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  })
  .refine(
    (data) => data.qrCodeData || data.qrData || data.scannedData || data.code,
    "QR code data is missing. Must provide one of: qrCodeData, qrData, scannedData, or code",
  );

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.role ||
      !["STUDENT", "WORKER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = checkInSchema.parse(body);

    // Extract QR code data from any supported field name
    const rawQrCodeData =
      validatedData.qrCodeData ||
      validatedData.qrData ||
      validatedData.scannedData ||
      validatedData.code;

    // Normalize QR code data: trim and remove quotes
    const normalizedQrCodeData = String(rawQrCodeData || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    // DEBUG: Log received QR code data
    console.log("CHECK-IN QR RECEIVED:", normalizedQrCodeData);
    console.log("CHECK-IN QR LENGTH:", normalizedQrCodeData.length);

    // Find matching active office location using ONLY qrCodeData and isActive
    const officeLocation = await prisma.officeLocation.findFirst({
      where: {
        qrCodeData: normalizedQrCodeData,
        isActive: true,
      },
    });

    // DEBUG: Log all active office locations for comparison
    const activeLocations = await prisma.officeLocation.findMany({
      where: { isActive: true },
      select: { id: true, name: true, qrCodeData: true },
    });

    console.log(
      "ACTIVE OFFICE QR VALUES:",
      activeLocations.map((l) => ({
        id: l.id,
        name: l.name,
        length: l.qrCodeData?.length,
        matches: l.qrCodeData?.trim() === normalizedQrCodeData,
      })),
    );

    if (!officeLocation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or inactive attendance QR code. Please ask your Mentor to print the latest QR code.",
        },
        { status: 400 },
      );
    }

    let profileId: string | null = null;

    if (session.user.role === "WORKER") {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!workerProfile) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Worker profile is not provisioned yet. ERP synchronization must complete before attendance can be used.",
          },
          { status: 403 },
        );
      }

      profileId = workerProfile.id;
    } else {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!studentProfile) {
        return NextResponse.json(
          {
            success: false,
            message: "Student profile is not provisioned yet.",
          },
          { status: 403 },
        );
      }

      profileId = studentProfile.id;
    }

    const activeSession = await prisma.attendance.findFirst({
      where:
        session.user.role === "WORKER"
          ? { worker: { userId: session.user.id }, status: "ACTIVE" }
          : { student: { userId: session.user.id }, status: "ACTIVE" },
    });

    if (activeSession) {
      return NextResponse.json(
        {
          error:
            "You already have an active attendance session. Please check out first.",
          activeSession: {
            id: activeSession.id,
            checkInTime: activeSession.checkInTime,
            officeLocationId: activeSession.officeLocationId,
          },
        },
        { status: 400 },
      );
    }

    // Verify user location against the officeLocation found by QR
    const locationVerification = GeolocationService.verifyLocation(
      {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        accuracy: validatedData.accuracy,
        timestamp: Date.now(),
      },
      officeLocation,
    );

    if (!locationVerification.isValid) {
      return NextResponse.json(
        {
          error: "Location verification failed",
          message: locationVerification.message,
          distance: locationVerification.distance,
        },
        { status: 400 },
      );
    }

    // Create attendance record
    const attendance =
      session.user.role === "WORKER"
        ? await prisma.attendance.create({
            data: {
              worker: { connect: { id: profileId! } },
              officeLocation: { connect: { id: officeLocation.id } },
              checkInTime: new Date(),
              checkInLat: validatedData.latitude,
              checkInLng: validatedData.longitude,
              status: "ACTIVE",
              qrCodeData: normalizedQrCodeData,
              ipAddress:
                request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                "unknown",
              userAgent: request.headers.get("user-agent") || "unknown",
            },
            include: {
              officeLocation: true,
              student: {
                include: {
                  user: true,
                },
              },
              worker: {
                include: {
                  user: true,
                },
              },
            },
          })
        : await prisma.attendance.create({
            data: {
              student: { connect: { id: profileId! } },
              officeLocation: { connect: { id: officeLocation.id } },
              checkInTime: new Date(),
              checkInLat: validatedData.latitude,
              checkInLng: validatedData.longitude,
              status: "ACTIVE",
              qrCodeData: normalizedQrCodeData,
              ipAddress:
                request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                "unknown",
              userAgent: request.headers.get("user-agent") || "unknown",
            },
            include: {
              officeLocation: true,
              student: {
                include: {
                  user: true,
                },
              },
              worker: {
                include: {
                  user: true,
                },
              },
            },
          });

    return NextResponse.json({
      success: true,
      message: locationVerification.message,
      attendance,
    });
  } catch (error) {
    console.error("Check-in error:", error);
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
