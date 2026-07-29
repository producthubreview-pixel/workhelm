import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/settings-schema";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      phone: true,
      image: true,
      address: true,
      businessCategory: true,
      timezone: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    image: user.image || "",
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify user exists
  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      businessName: data.businessName,
      phone: data.phone,
      image: data.logoUrl || null,
      address: data.address || null,
      businessCategory: data.businessCategory || null,
      timezone: data.timezone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      phone: true,
      image: true,
      address: true,
      businessCategory: true,
      timezone: true,
    },
  });

  return NextResponse.json(updated);
}
