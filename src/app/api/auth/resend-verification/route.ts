import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    // Only allow resending to your own email
    if (email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete any existing verification tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: `verify:${email}` },
    });

    // Generate new token
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
    const html = verificationEmailHtml(verifyUrl);
    await sendEmail({ to: email, subject: "Verify your WorkHelm email", html });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json({ error: "Failed to resend" }, { status: 500 });
  }
}
