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
    ];
  }

  if (status) {
    where.status = status as any;
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
      serviceRequested: data.serviceRequested || null,
      estimatedValue: data.estimatedValue ?? null,
      source: data.source || null,
      status: data.status,
      priority: data.priority,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
