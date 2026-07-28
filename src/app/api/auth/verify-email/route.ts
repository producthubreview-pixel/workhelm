import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || !verificationToken.identifier.startsWith("verify:")) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Verification token has expired" }, { status: 400 });
    }

    const email = verificationToken.identifier.replace("verify:", "");

    // Mark email as verified
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete the token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    console.error("Verify email error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
