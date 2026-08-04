import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadFormSchema } from "@/lib/lead-schema";
import { sendTemplateEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = leadFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const updated = await db.lead.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName || null,
      phone: data.phone,
      email: data.email || null,
      serviceAddress: data.serviceAddress || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      serviceRequested: data.serviceRequested || null,
      estimatedValue: data.estimatedValue ?? null,
      source: data.source || null,
      status: data.status,
      priority: data.priority,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      notes: data.notes || null,
    },
  });

  // Keep FollowUp records in sync with Lead.nextFollowUpAt:
  // - date set      → update the existing OPEN follow-up (or create one if
  //                   none exists) so the Follow-Ups page / Today dashboard
  //                   stay accurate
  // - date cleared  → remove OPEN follow-ups tied to the lead's previously
  //                   scheduled date so they don't linger as stale items
  if (data.nextFollowUpAt) {
    const existingOpen = await db.followUp.findFirst({
      where: { leadId: id, userId, status: "OPEN" },
      orderBy: { dueAt: "asc" },
    });
    if (existingOpen) {
      await db.followUp.update({
        where: { id: existingOpen.id },
        data: { dueAt: new Date(data.nextFollowUpAt) },
      });
    } else {
      const followUpName =
        [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
        "lead";
      await db.followUp.create({
        data: {
          leadId: id,
          userId,
          title: `Follow up with ${followUpName}`,
          dueAt: new Date(data.nextFollowUpAt),
          status: "OPEN",
          notes: `Initial follow-up for ${followUpName}`,
        },
      });
    }
  } else if (lead.nextFollowUpAt) {
    // The previously scheduled date was cleared — drop OPEN follow-ups so the
    // lead's follow-up disappears from Follow-Ups / Today consistently.
    await db.followUp.deleteMany({
      where: { leadId: id, userId, status: "OPEN" },
    });
  }

  // Job won → send the thank-you template. Email failure must never break the
  // update response (sendTemplateEmail never throws).
  if (updated.status === "WON" && lead.status !== "WON" && updated.email) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { businessName: true },
      });
      await sendTemplateEmail(
        "THANK_YOU",
        updated.email,
        [updated.firstName, updated.lastName].filter(Boolean).join(" ") || updated.firstName,
        {
          "{{business}}": user?.businessName || "our team",
          "{{service}}": updated.serviceRequested || "recent job",
        },
        userId
      );
    } catch (error) {
      console.error("Failed to send thank-you email:", error);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clean up associated records before deleting the lead
  await db.followUp.deleteMany({ where: { leadId: id } });

  await db.lead.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
