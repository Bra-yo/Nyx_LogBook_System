import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorCohortLearnerWhereClause } from "@/lib/access-control";
import { DocumentGenerationService } from "@/lib/services/document-generation";
import { readFile } from "node:fs/promises";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supervisor = await prisma.supervisorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  const { id } = await params;
  const learner = supervisor ? await prisma.studentProfile.findFirst({ where: { id, ...buildMentorCohortLearnerWhereClause(supervisor.id) }, include: { user: true, cohort: true } }) : null;
  if (!learner?.user.registrationIdentifier) return NextResponse.json({ error: "Learner document unavailable" }, { status: 404 });
  const artifact = await DocumentGenerationService.generateDocument("PROVISIONAL_ADMISSION_LETTER", {
    recipientName: learner.user.name,
    email: learner.user.email,
    phoneNumber: learner.user.phone || "Not provided",
    registrationTrack: learner.cohort?.mentorshipTrack || learner.mentorshipTrack || "Mentorship",
    registrationIdentifier: learner.user.registrationIdentifier,
    paymentStatus: learner.user.paymentStatus,
    registrationStatus: learner.user.accountStatus,
  });
  return new NextResponse(await readFile(artifact.filePath), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${artifact.fileName}"` } });
}