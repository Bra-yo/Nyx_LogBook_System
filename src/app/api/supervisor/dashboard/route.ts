import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMentorCohortLearnerWhereClause } from "@/lib/access-control";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supervisor = await prisma.supervisorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!supervisor) return NextResponse.json({ error: "Supervisor profile not found" }, { status: 404 });

  const learnerWhere = buildMentorCohortLearnerWhereClause(supervisor.id);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryWhere = { student: learnerWhere };
  const [totalLearners, pendingReviews, approvedToday, weeklySubmissions, recentEntries] = await Promise.all([
    prisma.studentProfile.count({ where: learnerWhere }),
    prisma.logbookEntry.count({ where: { ...entryWhere, status: "PENDING" } }),
    prisma.logbookEntry.count({ where: { ...entryWhere, status: "APPROVED", updatedAt: { gte: today } } }),
    prisma.logbookEntry.count({ where: { ...entryWhere, createdAt: { gte: weekAgo } } }),
    prisma.logbookEntry.findMany({
      where: entryWhere,
      select: { id: true, title: true, status: true, createdAt: true, student: { select: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  return NextResponse.json({ success: true, stats: { totalLearners, pendingReviews, approvedToday, weeklySubmissions }, recentEntries });
}