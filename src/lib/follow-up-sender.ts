import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { DEFAULT_TEMPLATES, fillTemplate } from "@/lib/template-defaults";

/**
 * Sends due lead and estimate follow-ups for one owner. Failed sends remain open for retry.
 * This is a best-effort side effect: any error (DB drift, email provider outage)
 * is logged and swallowed so callers like the Today dashboard never fail because
 * follow-up sending failed.
 */
export async function sendDueFollowUps(userId?: string): Promise<{ processed: number; sent: number }> {
  try {
    return await sendDueFollowUpsUnsafe(userId);
  } catch (error) {
    console.error("Failed to run follow-up sender:", error);
    return { processed: 0, sent: 0 };
  }
}

async function sendDueFollowUpsUnsafe(userId?: string): Promise<{ processed: number; sent: number }> {
  const followUps = await db.followUp.findMany({
    where: {
      status: "OPEN",
      dueAt: { lte: new Date() },
      ...(userId ? { userId } : {}),
      OR: [{ estimateId: { not: null } }, { leadId: { not: null } }],
    },
    include: {
      estimate: {
        include: {
          customer: { select: { name: true, email: true } },
          user: { select: { businessName: true } },
        },
      },
      lead: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          serviceRequested: true,
          user: { select: { businessName: true } },
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  let sent = 0;
  for (const followUp of followUps) {
    const estimate = followUp.estimate;
    const lead = followUp.lead;
    const recipient = estimate
      ? {
          email: estimate.customer.email,
          name: estimate.customer.name,
          business: estimate.user.businessName,
          service: estimate.title,
          expires: estimate.expiresAt ? estimate.expiresAt.toLocaleDateString() : "the stated expiration date",
        }
      : lead
        ? {
            email: lead.email,
            name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
            business: lead.user.businessName,
            service: lead.serviceRequested || "requested service",
            expires: "the stated expiration date",
          }
        : null;
    if (!recipient?.email) continue;

    const category = followUp.templateCategory === "FOLLOW_UP_2" ? "FOLLOW_UP_2" : "FOLLOW_UP_1";
    try {
      const savedTemplate = await db.messageTemplate.findFirst({
        where: { userId: followUp.userId, category },
      });
      const template = savedTemplate || DEFAULT_TEMPLATES.find((item) => item.category === category)!;
      const values = {
        "{{name}}": recipient.name,
        "{{business}}": recipient.business || "our team",
        "{{service}}": recipient.service,
        "{{expires}}": recipient.expires,
      };
      const delivered = await sendEmail({
        to: recipient.email,
        subject: fillTemplate(template.subject, values),
        body: fillTemplate(template.body, values),
      });
      if (!delivered) continue;

      await db.followUp.update({
        where: { id: followUp.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      sent++;
    } catch (error) {
      console.error(`Failed to send follow-up ${followUp.id}:`, error);
    }
  }

  return { processed: followUps.length, sent };
}
