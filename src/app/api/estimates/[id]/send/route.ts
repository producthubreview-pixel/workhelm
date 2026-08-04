import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const estimate = await db.estimate.findUnique({ where: { id } });
  if (!estimate || estimate.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (estimate.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft estimates can be marked as sent" },
      { status: 400 }
    );
  }

  // Set nextFollowUpAt to 3 days from now as default
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const updated = await db.estimate.update({
    where: { id },
    data: {
      status: "SENT",
      nextFollowUpAt: threeDaysFromNow,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      user: { select: { businessName: true } },
    },
  });

  // Sending an estimate should have exactly one automatic follow-up. Reuse an
  // existing follow-up (including one created by the estimate creation flow)
  // rather than creating duplicates on retries.
  const existingFollowUp = await db.followUp.findFirst({
    where: { estimateId: id, userId: session.user.id },
  });
  if (!existingFollowUp) {
    await db.followUp.create({
      data: {
        userId: session.user.id,
        estimateId: id,
        customerId: updated.customerId,
        title: "Estimate follow-up",
        dueAt: threeDaysFromNow,
        templateCategory: "FOLLOW_UP",
        status: "OPEN",
      },
    });
  }

  // Keep the linked lead's pipeline stage in sync with the estimate lifecycle.
  if (updated.customer.lead?.id) {
    await db.lead.update({ where: { id: updated.customer.lead.id }, data: { status: "ESTIMATE_SENT" } });
  }

  if (updated.customer.email) {
    try {
      const amount =
        updated.amount == null ? "to be confirmed" : `${updated.amount.toFixed(2)}`;
      await sendTemplateEmail(
        "ESTIMATE_SENT",
        updated.customer.email,
        updated.customer.name,
        {
          "{{business}}": updated.user.businessName || "our team",
          "{{service}}": updated.title,
          "{{estimate_amount}}": amount,
          "{{expires}}": updated.expiresAt
            ? updated.expiresAt.toLocaleDateString()
            : "the stated expiration date",
        },
        session.user.id
      );
    } catch (error) {
      console.error("Failed to send estimate email:", error);
    }
  }

  return NextResponse.json(updated);
}
