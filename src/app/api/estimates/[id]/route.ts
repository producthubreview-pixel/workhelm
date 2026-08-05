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
      lead: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
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
  const customerId = data.customerId || null;
  const leadId = data.leadId || null;

  // Exactly one of lead/customer must link the estimate (mutually exclusive).
  if (leadId && customerId) {
    return NextResponse.json(
      { error: "An estimate can link to a lead or a customer, not both" },
      { status: 400 }
    );
  }

  // Verify the newly linked entity belongs to this user if it changed.
  if (customerId && customerId !== estimate.customerId) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || customer.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }
  }
  if (leadId && leadId !== estimate.leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== session.user.id) {
      return NextResponse.json({ error: "Lead not found" }, { status: 400 });
    }
  }

  // Only send an "estimate updated" email when something the customer sees
  // actually changed (title, amount, expiration, or the entity it belongs to).
  const meaningfulChange =
    data.title !== estimate.title ||
    (data.amount ?? null) !== estimate.amount ||
    (data.expiresAt ? new Date(data.expiresAt).getTime() : null) !==
      (estimate.expiresAt ? estimate.expiresAt.getTime() : null) ||
    customerId !== estimate.customerId ||
    leadId !== estimate.leadId;

  const updated = await db.estimate.update({
    where: { id },
    data: {
      customerId,
      leadId,
      title: data.title,
      amount: data.amount ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes || null,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true, email: true } },
      user: { select: { businessName: true } },
    },
  });

  // Email delivery failures must not break the update response.
  if (meaningfulChange) {
    const recipientEmail = updated.customer?.email ?? updated.lead?.email;
    const recipientName =
      updated.customer?.name ??
      ([updated.lead?.firstName, updated.lead?.lastName].filter(Boolean).join(" ") ||
        "there");
    if (recipientEmail) {
      try {
        const amount =
          updated.amount == null ? "to be confirmed" : `${updated.amount.toFixed(2)}`;
        await sendTemplateEmail(
          "ESTIMATE_UPDATED",
          recipientEmail,
          recipientName,
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
