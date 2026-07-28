import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, businessName, email, phone, password, category, timezone } = await req.json();
    if (!email || !password || !name || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    const hashed = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await db.user.create({
      data: { name, businessName, email, phone, password: hashed, businessCategory: category, timezone, trialEndsAt, subscriptionStatus: "trialing" }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
