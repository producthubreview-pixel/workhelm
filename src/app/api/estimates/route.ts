import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimateFormSchema } from "@/lib/estimate-schema";
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

  const where: Prisma.EstimateWhereInput = { userId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status as any;
  }

  const estimates = await db.estimate.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      _count: {
        select: { followUps: true },
      },
    },
  });

  const result = estimates.map(({ _count, ...e }) => ({
    ...e,
    followUpCount: _count.followUps,
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

  // Verify customer belongs to user
  const customer = await db.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer || customer.userId !== userId) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 400 }
    );
  }

  const estimate = await db.estimate.create({
    data: {
      userId,
      customerId: data.customerId,
      title: data.title,
      amount: data.amount ?? null,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes || null,
      status: "DRAFT",
    },
    include: {
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(estimate, { status: 201 });
}
