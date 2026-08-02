import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "ESTIMATE_NEEDED", "ESTIMATE_SENT", "FOLLOW_UP", "WON", "LOST"]),
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

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, any> = { status: parsed.data.status };

  if (parsed.data.status === "CONTACTED") {
    updateData.lastContactedAt = new Date();
  }

  const updated = await db.lead.update({
    where: { id },
    data: updateData,
  });

  // Terminal leads no longer need follow-up actions. Complete any remaining
  // open follow-ups so they disappear from Today and the overdue queue.
  if (parsed.data.status === "WON" || parsed.data.status === "LOST") {
    await db.followUp.updateMany({
      where: { leadId: id, userId: session.user.id, status: "OPEN" },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  return NextResponse.json(updated);
}
