import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
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
    const user = await db.user.create({
      data: { name, businessName, email, phone, password: hashed, businessCategory: category, timezone, plan: "FREE", subscriptionStatus: null, trialEndsAt: null, emailVerified: null }
    });

    // Generate verification token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await db.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token,
        expires,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

    // Send verification email via Resend
    const html = verificationEmailHtml(verifyUrl);
    const emailSent = await sendEmail({ to: email, subject: "Verify your WorkHelm email", html });

    if (!emailSent) {
      console.error(`[REGISTER] Failed to send verification email to ${email}. User created but email not delivered.`);
    }

    return NextResponse.json({ success: true, message: "Check your email for a verification link" });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
