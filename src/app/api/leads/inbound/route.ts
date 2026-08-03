import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public inbound endpoint for email-to-lead forwarding.
 *
 * When a user forwards a lead email to their personal forwarding address
 * (leads.<code>@getworkhelm.com), the mail processor POSTs the parsed
 * message here. Security is the unguessable forwardingCode itself, so this
 * route intentionally requires no session auth.
 */

type ParsedSender = {
  firstName: string;
  lastName: string | null;
  email: string | null;
};

/** Extract name + email from an email "From" header value. */
function parseSender(from: string | undefined | null): ParsedSender {
  const raw = (from || "").trim();
  let name = "";
  let email = "";

  // "John Smith <john@example.com>"
  const angleMatch = raw.match(/^([^<]*?)\s*<([^>]+)>$/);
  if (angleMatch) {
    name = angleMatch[1].trim();
    email = angleMatch[2].trim();
  } else if (raw.includes("@")) {
    // Bare address ("john@example.com") or "John Smith john@example.com"
    const parts = raw.split(/\s+/);
    const emailPart = parts.find((p) => p.includes("@")) || "";
    email = emailPart;
    name = parts.filter((p) => !p.includes("@")).join(" ");
  } else {
    name = raw;
  }

  const nameParts = name.split(/\s+/).filter(Boolean);

  // Fall back to the email local-part when no display name was provided,
  // so firstName is never empty (Lead.firstName is required).
  if (nameParts.length === 0 && email.includes("@")) {
    const local = email.split("@")[0].replace(/[._-]+/g, " ");
    if (local.trim()) {
      nameParts.push(...local.trim().split(/\s+/));
    }
  }

  const firstName =
    (nameParts[0] || "Lead").charAt(0).toUpperCase() +
    (nameParts[0] || "Lead").slice(1);
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  return { firstName, lastName, email: email || null };
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { forwardingCode, from, subject, body: bodyText } = body || {};

  if (!forwardingCode) {
    return NextResponse.json(
      { error: "Missing forwarding code" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { forwardingCode: String(forwardingCode) },
    select: { id: true, plan: true, subscriptionStatus: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid forwarding code" },
      { status: 404 }
    );
  }

  // Same plan-limit enforcement as the authenticated lead creation endpoint,
  // so forwarding email can't be used to bypass limits.
  const leadCount = await db.lead.count({ where: { userId: user.id } });
  if (user.plan === "FREE" && leadCount >= 5) {
    return NextResponse.json(
      {
        error:
          "Free plan limit of 5 leads reached. Upgrade to Starter or Pro to keep using email forwarding.",
        code: "PLAN_LIMIT",
      },
      { status: 403 }
    );
  }
  if (user.plan === "STARTER" && leadCount >= 250) {
    return NextResponse.json(
      {
        error:
          "Starter plan limit of 250 leads reached. Upgrade to Pro for unlimited leads.",
        code: "PLAN_LIMIT",
      },
      { status: 403 }
    );
  }
  if (
    (user.subscriptionStatus === "canceled" ||
      user.subscriptionStatus === "locked") &&
    leadCount > 5
  ) {
    return NextResponse.json(
      {
        error:
          "Your subscription has ended. Reactivate your subscription to continue adding leads.",
        code: "SUBSCRIPTION_LOCKED",
      },
      { status: 403 }
    );
  }

  const { firstName, lastName, email } = parseSender(from);
  const notes = [subject, bodyText].filter(Boolean).join("\n\n").trim();

  const lead = await db.lead.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      email,
      source: "email",
      status: "NEW",
      priority: "MEDIUM",
      notes: notes || null,
    },
  });

  // Keep app behavior consistent: every new lead gets an OPEN follow-up so
  // it appears on the Today dashboard and Follow-Ups page immediately.
  const followUpName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const defaultDueAt = new Date();
  defaultDueAt.setHours(23, 59, 59, 999);
  await db.followUp.create({
    data: {
      leadId: lead.id,
      userId: user.id,
      title: `Follow up with ${followUpName}`,
      dueAt: defaultDueAt,
      status: "OPEN",
      notes: `Initial follow-up for ${followUpName} (forwarded email)`,
    },
  });

  return NextResponse.json(lead, { status: 200 });
}
