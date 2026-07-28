import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const rescheduleSchema = z.object({
  dueAt: z.string().min(1, "New due date is required"),
});

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

  const body = await req.json();
  const parsed = rescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await db.followUp.update({
    where: { id },
    data: {
      dueAt: new Date(parsed.data.dueAt),
    },
    include: {
      lead: { select: { firstName: true, lastName: true } },
      customer: { select: { name: true } },
      estimate: { select: { title: true } },
    },
  });

  return NextResponse.json(updated);
}
