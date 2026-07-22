import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailDelivery } from "@/lib/services/email-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const delivery = await prisma.emailDelivery.findUnique({ where: { id } });
  if (!delivery) {
    return NextResponse.json({ error: "Email delivery not found" }, { status: 404 });
  }

  await sendEmailDelivery(id);
  const updated = await prisma.emailDelivery.findUnique({ where: { id } });
  return NextResponse.json({ success: updated?.status === "SENT", delivery: updated });
}