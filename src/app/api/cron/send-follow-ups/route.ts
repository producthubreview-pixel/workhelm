import { NextResponse } from "next/server";

/**
 * Scheduled follow-up sending is DISABLED. The business model is
 * copy-to-clipboard templates only — no automated email sending — so due
 * follow-ups must stay OPEN and show as Overdue until the user acts on them.
 *
 * If automated sending is ever wanted, wire src/lib/follow-up-sender.ts to a
 * scheduler behind a feature flag and restore the call here.
 */
export async function GET() {
  return NextResponse.json(
    { disabled: true, message: "Automated follow-up sending is disabled." },
    { status: 404 }
  );
}
