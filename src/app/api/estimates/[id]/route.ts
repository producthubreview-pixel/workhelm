import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimateFormSchema } from "@/lib/estimate-schema";
import { sendTemplateEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const estimate = await db.estimate.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, email: true },
      },
      followUps: {
        orderBy: { dueAt: "desc" },
      },
    },
  });

  if (!estimate || estimate.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(estimate);
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

  const estimate = await db.estimate.findUnique({ where: { id } });
  if (!estimate || estimate.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = estimateFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify customer belongs to user if changed
  if (data.customerId !== estimate.customerId) {
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer || customer.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }
  }

  // Only send an "estimate updated" email when something the customer sees
  // actually changed (title, amount, expiration, or the customer it belongs to).
  const meaningfulChange =
    data.title !== estimate.title ||
    (data.amount ?? null) !== estimate.amount ||
    (data.expiresAt ? new Date(data.expiresAt).getTime() : null) !==
      (estimate.expiresAt ? estimate.expiresAt.getTime() : null) ||
    data.customerId !== estimate.customerId;

  const updated = await db.estimate.update({
    where: { id },
    data: {
      customerId: data.customerId,
      title: data.title,
      amount: data.amount ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes || null,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      user: { select: { businessName: true } },
    },
  });

  // Email delivery failures must not break the update response.
  if (meaningfulChange && updated.customer.email) {
    try {
      const amount =
        updated.amount == null ? "to be confirmed" : `${updated.amount.toFixed(2)}`;
      await sendTemplateEmail(
        "ESTIMATE_UPDATED",
        updated.customer.email,
        updated.customer.name,
        {
          "{{business}}": updated.user.businessName || "our team",
          "{{service}}": updated.title,
          "{{estimate_amount}}": amount,
          "{{expires}}": updated.expiresAt
            ? updated.expiresAt.toLocaleDateString()
            : "the stated expiration date",
        },
        session.user.id
      );
    } catch (error) {
      console.error("Failed to send estimate updated email:", error);
    }
  }

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

  const estimate = await db.estimate.findUnique({ where: { id } });
  if (!estimate || estimate.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.estimate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
