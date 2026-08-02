import { NextResponse } from "next/server";
import { sendDueFollowUps } from "@/lib/follow-up-sender";

/**
 * Processes all due follow-ups. Kept as a route so it can later be wired to a
 * scheduler; the dashboard also invokes the shared logic for MVP triggering.
 */
export async function GET() {
  const result = await sendDueFollowUps();
  return NextResponse.json(result);
}
