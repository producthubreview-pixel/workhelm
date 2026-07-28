import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { followUpFormSchema } from "@/lib/followup-schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const followUp = await db.followUp.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, name: true } },
      estimate: { select: { id: true, title: true } },
    },
  });
  if (!followUp || followUp.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(followUp);
}

export async function PUT(
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
  const parsed = followUpFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await db.followUp.update({
    where: { id },
    data: {
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
      leadId: parsed.data.leadId || null,
      customerId: parsed.data.customerId || null,
      estimateId: parsed.data.estimateId || null,
      notes: parsed.data.notes || null,
    },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, name: true } },
      estimate: { select: { id: true, title: true } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
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
  await db.followUp.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
