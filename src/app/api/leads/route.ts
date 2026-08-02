import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadFormSchema } from "@/lib/lead-schema";
import { Prisma } from "@prisma/client";

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
    select: { plan: true, subscriptionStatus: true },
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

  // Keep FollowUp records in sync: when a lead is created with a next
  // follow-up date, create an OPEN FollowUp so it shows up on the Follow-Ups
  // page and the Today dashboard (both query the FollowUp table).
  if (data.nextFollowUpAt) {
    const followUpName =
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
      "lead";
    await db.followUp.create({
      data: {
        leadId: lead.id,
        userId,
        title: `Follow up with ${followUpName}`,
        dueAt: new Date(data.nextFollowUpAt),
        status: "OPEN",
        notes: `Initial follow-up for ${followUpName}`,
      },
    });
  }

  return NextResponse.json(lead, { status: 201 });
}
