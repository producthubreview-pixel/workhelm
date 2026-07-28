import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerFormSchema } from "@/lib/customer-schema";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const showArchived = searchParams.get("archived") === "true";

  const where: Prisma.CustomerWhereInput = {
    userId,
    isArchived: showArchived ? undefined : false,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { serviceAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { estimates: true },
      },
    },
  });

  const result = customers.map(({ _count, ...c }) => ({
    ...c,
    estimateCount: _count.estimates,
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

  const parsed = customerFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const customer = await db.customer.create({
    data: {
      userId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      serviceAddress: data.serviceAddress || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
