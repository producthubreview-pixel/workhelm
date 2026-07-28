import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    const user = await db.user.create({
      data: { name, businessName, email, phone, password: hashed, businessCategory: category, timezone, trialEndsAt, subscriptionStatus: "trialing", emailVerified: null }
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await db.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token,
        expires,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

    // Log verification link for now (will use Resend later)
    console.log(`\n========================================`);
    console.log(`Email verification link for ${email}:`);
    console.log(verifyUrl);
    console.log(`========================================\n`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
