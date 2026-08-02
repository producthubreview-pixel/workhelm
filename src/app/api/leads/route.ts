import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadFormSchema } from "@/lib/lead-schema";
import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { DEFAULT_TEMPLATES, fillTemplate } from "@/lib/template-defaults";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const source = searchParams.get("source") || "";

  const where: Prisma.LeadWhereInput = { userId };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { serviceAddress: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
      { zip: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status as any;
  } else {
    // Default listing: exclude terminal statuses (WON/LOST — converted-to-customer
    // leads are set to WON by the convert flow) so counts and lists show active leads.
    where.status = { notIn: ["WON", "LOST"] };
  }

  if (priority) {
    where.priority = priority as any;
  }

  if (source) {
    where.source = { contains: source, mode: "insensitive" };
  }

  const leads = await db.lead.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Plan limit enforcement: Starter plan max 250 leads
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, businessName: true },
  });

  if (user?.plan === "FREE") {
    const leadCount = await db.lead.count({ where: { userId } });
    if (leadCount >= 5) {
      return NextResponse.json(
        {
          error: "You've reached your Free plan limit of 5 leads. Please upgrade to Starter or Pro for more leads.",
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }
  }

  // Block lead creation when subscription ended with too many leads
  if (
    user?.subscriptionStatus === "canceled" ||
    user?.subscriptionStatus === "locked"
  ) {
    const leadCount = await db.lead.count({ where: { userId } });
    if (leadCount > 5) {
      return NextResponse.json(
        {
          error: "Your subscription has ended and you have more than 5 leads. Please reactivate your subscription to continue adding leads.",
          code: "SUBSCRIPTION_LOCKED",
        },
        { status: 403 }
      );
    }
  }

  if (user?.plan === "STARTER") {
    const leadCount = await db.lead.count({ where: { userId } });
    if (leadCount >= 250) {
      return NextResponse.json(
        {
          error: "You've reached your Starter plan limit of 250 leads. Please upgrade to Pro for unlimited leads.",
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }
  }

  const body = await req.json();

  const parsed = leadFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const lead = await db.lead.create({
    data: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName || null,
      phone: data.phone,
      email: data.email || null,
      serviceAddress: data.serviceAddress || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      serviceRequested: data.serviceRequested || null,
      estimatedValue: data.estimatedValue ?? null,
      source: data.source || null,
      status: data.status,
      priority: data.priority,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      notes: data.notes || null,
    },
  });

  // Every new lead gets an OPEN FollowUp so it shows up on the Follow-Ups
  // page and the Today dashboard (both query the FollowUp table). When a
  // follow-up date was provided, use it as the due date; otherwise default
  // to the end of today so the follow-up is actionable immediately and lands
  // in the "Due Today" tab instead of being missing.
  const followUpName =
    [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "lead";
  const defaultDueAt = new Date();
  defaultDueAt.setHours(23, 59, 59, 999);
  await db.followUp.create({
    data: {
      leadId: lead.id,
      userId,
      title: `Follow up with ${followUpName}`,
      dueAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : defaultDueAt,
      status: "OPEN",
      notes: `Initial follow-up for ${followUpName}`,
    },
  });

  // When a lead is created with an estimated value, it represents an active
  // sales opportunity, so schedule the same 3-day / 10-day follow-up cadence
  // that estimate creation uses. Their category is explicit so edits to other
  // follow-ups cannot change which message template applies.
  if (lead.estimatedValue != null) {
    const followUpOneAt = new Date();
    followUpOneAt.setDate(followUpOneAt.getDate() + 3);
    const followUpTwoAt = new Date();
    followUpTwoAt.setDate(followUpTwoAt.getDate() + 10);
    await db.followUp.createMany({
      data: [
        { userId, leadId: lead.id, title: "Follow-Up #1", dueAt: followUpOneAt, templateCategory: "FOLLOW_UP_1", status: "OPEN" },
        { userId, leadId: lead.id, title: "Follow-Up #2", dueAt: followUpTwoAt, templateCategory: "FOLLOW_UP_2", status: "OPEN" },
      ],
    });
  }

  // Notify the lead without making email delivery failure block lead creation.
  if (lead.email) {
    try {
      const savedTemplate = await db.messageTemplate.findFirst({
        where: { userId, category: "NEW_LEAD" },
      });
      const template = savedTemplate || DEFAULT_TEMPLATES.find((item) => item.category === "NEW_LEAD")!;
      const values = {
        "{{name}}": [lead.firstName, lead.lastName].filter(Boolean).join(" "),
        "{{business}}": user?.businessName || "our team",
        "{{service}}": lead.serviceRequested || "service request",
      };
      await sendEmail({
        to: lead.email,
        subject: fillTemplate(template.subject, values),
        body: fillTemplate(template.body, values),
      });
    } catch (error) {
      console.error("Failed to send new lead email:", error);
    }
  }

  return NextResponse.json(lead, { status: 201 });
}
