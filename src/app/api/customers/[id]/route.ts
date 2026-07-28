import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerFormSchema } from "@/lib/customer-schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
      },
      followUps: {
        orderBy: { dueAt: "desc" },
      },
      lead: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!customer || customer.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
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

  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer || customer.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = customerFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const updated = await db.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      serviceAddress: data.serviceAddress || null,
      notes: data.notes || null,
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

  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer || customer.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.customer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
