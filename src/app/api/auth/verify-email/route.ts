import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
    }

    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || !verificationToken.identifier.startsWith("verify:")) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL("/login?error=expired_token", req.url));
    }

    const email = verificationToken.identifier.replace("verify:", "");

    // Mark email as verified
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete the token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (err) {
    console.error("Verify email error:", err);
    return NextResponse.redirect(new URL("/login?error=verify_failed", req.url));
  }
}
