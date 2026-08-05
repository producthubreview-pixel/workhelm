import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimateFormSchema } from "@/lib/estimate-schema";
import { Prisma } from "@prisma/client";
import { sendTemplateEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Prisma.EstimateWhereInput = { userId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { lead: { firstName: { contains: search, mode: "insensitive" } } },
      { lead: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status as any;
  }

  const estimates = await db.estimate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      lead: {
        select: { id: true, firstName: true, lastName: true },
      },
      followUps: {
        select: { id: true },
      },
    },
  });

  const result = estimates.map(({ followUps, ...e }) => ({
    ...e,
    followUpCount: followUps.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
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

  // Verify the linked entity belongs to this user.
  if (customerId) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || customer.userId !== userId) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }
  }
  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== userId) {
      return NextResponse.json({ error: "Lead not found" }, { status: 400 });
    }
  }

  // Sent estimates are followed up three days later by default, matching the
  // existing Mark as Sent flow for legacy draft estimates.
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const estimate = await db.estimate.create({
    data: {
      userId,
      customerId,
      leadId,
      title: data.title,
      amount: data.amount ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      nextFollowUpAt: threeDaysFromNow,
      notes: data.notes || null,
      status: "SENT",
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true, email: true } },
      user: { select: { businessName: true } },
    },
  });

  // Schedule both follow-ups at creation time. Their category is explicit so
  // edits to other follow-ups cannot change which message gets sent. The
  // follow-up links to whichever entity the estimate links to.
  const followUpOneAt = new Date();
  followUpOneAt.setDate(followUpOneAt.getDate() + 3);
  const followUpTwoAt = new Date();
  followUpTwoAt.setDate(followUpTwoAt.getDate() + 10);
  await db.followUp.createMany({
    data: [
      { userId, estimateId: estimate.id, customerId, leadId, title: "Follow-Up #1", dueAt: followUpOneAt, templateCategory: "FOLLOW_UP", status: "OPEN" },
      { userId, estimateId: estimate.id, customerId, leadId, title: "Follow-Up #2", dueAt: followUpTwoAt, templateCategory: "FOLLOW_UP", status: "OPEN" },
    ],
  });

  // Email delivery failures must not prevent the estimate from being created.
  // sendTemplateEmail never throws and returns false when the template is
  // disabled or delivery fails — the response is unaffected either way.
  const recipientEmail = estimate.customer?.email ?? estimate.lead?.email;
  const recipientName =
    estimate.customer?.name ??
    ([estimate.lead?.firstName, estimate.lead?.lastName].filter(Boolean).join(" ") ||
      "there");
  if (recipientEmail) {
    try {
      const amount =
        estimate.amount == null
          ? "to be confirmed"
          : `${estimate.amount.toFixed(2)}`;
      await sendTemplateEmail(
        "ESTIMATE_SENT",
        recipientEmail,
        recipientName,
        {
          "{{business}}": estimate.user.businessName || "our team",
          "{{service}}": estimate.title,
          "{{estimate_amount}}": amount,
          "{{expires}}": estimate.expiresAt
            ? estimate.expiresAt.toLocaleDateString()
            : "the stated expiration date",
        },
        userId
      );
    } catch (error) {
      console.error("Failed to send estimate email:", error);
    }
  }

  return NextResponse.json(estimate, { status: 201 });
}
