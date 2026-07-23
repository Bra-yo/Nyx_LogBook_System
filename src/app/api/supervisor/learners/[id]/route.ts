import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorCohortLearnerWhereClause } from "@/lib/access-control";
import { DocumentIdentityService } from "@/lib/services/document-identity";
import { buildLearnerProgress } from "@/lib/services/learner-progress";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supervisor = await prisma.supervisorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!supervisor) {
    return NextResponse.json({ error: "Supervisor profile not found" }, { status: 404 });
  }

  const { id } = await params;
  const learner = await prisma.studentProfile.findFirst({
    where: { id, ...buildMentorCohortLearnerWhereClause(supervisor.id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          registrationIdentifier: true,
          paymentStatus: true,
          accountStatus: true,
          createdAt: true,
          bio: true,
          skills: true,
        },
      },
      department: { select: { id: true, name: true, code: true } },
      cohort: { select: { id: true, name: true, code: true, mentorshipTrack: true, status: true } },
      _count: {
        select: {
          logbookEntries: true,
          attendanceRecords: true,
          ProjectLearner: true,
          Milestone: true,
          assessments: true,
          WeeklyMentorTaskReview: true,
        },
      },
    },
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 });
  }

  const [submissions, approvedSubmissions] = await Promise.all([
    prisma.logbookEntry.findMany({
      where: { studentId: learner.id },
      select: { id: true, title: true, status: true, date: true, submittedAt: true, updatedAt: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.logbookEntry.count({ where: { studentId: learner.id, status: "APPROVED" } }),
  ]);

  let identity: { qrCode: string; barcode: string; verificationPath: string } | null = null;
  if (learner.user.registrationIdentifier) {
    try {
      const assets = await DocumentIdentityService.generateIdentityAssets(learner.user.registrationIdentifier);
      identity = {
        qrCode: `data:${assets.qrCodeMimeType};base64,${assets.qrCodeBuffer.toString("base64")}`,
        barcode: `data:${assets.barcodeMimeType};base64,${assets.barcodeBuffer.toString("base64")}`,
        verificationPath: assets.verificationPath,
      };
    } catch {
      identity = null;
    }
  }

  return NextResponse.json({
    success: true,
    learner: {
      ...learner,
      progress: { ...buildLearnerProgress(learner.user, learner._count), approvedSubmissions },
      submissions,
      documents: {
        admissionLetter: Boolean(learner.user.registrationIdentifier),
        identity,
      },
    },
  });
}