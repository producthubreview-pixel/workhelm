import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createFollowUpSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueAt: z.string().min(1, "Due date is required"),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  estimateId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const parsed = createFollowUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const followUp = await db.followUp.create({
    data: {
      userId,
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
      leadId: parsed.data.leadId || null,
      customerId: parsed.data.customerId || null,
      estimateId: parsed.data.estimateId || null,
      notes: parsed.data.notes || null,
      status: "OPEN",
    },
    include: {
      lead: { select: { firstName: true, lastName: true } },
      customer: { select: { name: true } },
      estimate: { select: { title: true } },
    },
  });

  return NextResponse.json(followUp, { status: 201 });
}
