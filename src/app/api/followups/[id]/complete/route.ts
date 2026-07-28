import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const followUp = await db.followUp.findUnique({ where: { id } });
  if (!followUp || followUp.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.followUp.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      lead: { select: { firstName: true, lastName: true } },
      customer: { select: { name: true } },
      estimate: { select: { title: true } },
    },
  });

  return NextResponse.json(updated);
}
