import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Email-to-lead forwarding address management.
 *
 * Each user gets a unique forwarding code; their address is
 * `leads.<code>@getworkhelm.com`. The code is random and unguessable —
 * it acts as the security token for the public inbound endpoint.
 */

const FORWARDING_DOMAIN = "getworkhelm.com";

function formatForwardingAddress(code: string): string {
  return `leads.${code}@${FORWARDING_DOMAIN}`;
}

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { forwardingCode: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    forwardingAddress: user.forwardingCode
      ? formatForwardingAddress(user.forwardingCode)
      : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Idempotent: if the user already has a code, return the existing address.
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { forwardingCode: true },
  });
  if (existing?.forwardingCode) {
    return NextResponse.json({
      forwardingAddress: formatForwardingAddress(existing.forwardingCode),
    });
  }

  // Generate a fresh code, retrying if the 1-in-4-billion unique collision
  // ever happens (forwardingCode is @unique in the schema).
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    try {
      await db.user.update({
        where: { id: userId },
        data: { forwardingCode: code },
      });
      return NextResponse.json({ forwardingAddress: formatForwardingAddress(code) });
    } catch (err: any) {
      if (err?.code === "P2002") continue; // unique constraint collision — retry
      throw err;
    }
  }

  return NextResponse.json(
    { error: "Could not generate a unique forwarding address. Please try again." },
    { status: 500 }
  );
}
