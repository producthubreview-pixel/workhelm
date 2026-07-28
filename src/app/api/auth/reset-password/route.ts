import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Find the reset token
    const resetToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken || !resetToken.identifier.startsWith("reset:")) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    const email = resetToken.identifier.replace("reset:", "");
    const hashed = await bcrypt.hash(password, 12);

    // Update password and delete token
    await db.user.update({
      where: { email },
      data: { password: hashed },
    });

    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
