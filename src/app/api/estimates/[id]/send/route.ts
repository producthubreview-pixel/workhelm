import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { DEFAULT_TEMPLATES, fillTemplate } from "@/lib/template-defaults";

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

  if (updated.customer.email) {
    try {
      const savedTemplate = await db.messageTemplate.findFirst({
        where: { userId: session.user.id, category: "ESTIMATE_SENT" },
      });
      const template = savedTemplate || DEFAULT_TEMPLATES.find((item) => item.category === "ESTIMATE_SENT")!;
      const values = {
        "{{name}}": updated.customer.name,
        "{{business}}": updated.user.businessName || "our team",
        "{{service}}": updated.title,
        "{{expires}}": updated.expiresAt ? updated.expiresAt.toLocaleDateString() : "the stated expiration date",
      };
      const amount = updated.amount == null ? "an amount to be confirmed" : `$${updated.amount.toFixed(2)}`;
      await sendEmail({
        to: updated.customer.email,
        subject: fillTemplate(template.subject, values),
        body: `${fillTemplate(template.body, values)}\n\nEstimate amount: ${amount}\nPlease reply to this email with any questions or to approve the work.`,
      });
    } catch (error) {
      console.error("Failed to send estimate email:", error);
    }
  }

  return NextResponse.json(updated);
}
