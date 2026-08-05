import { db } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";

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
          lead: { select: { firstName: true, lastName: true, email: true } },
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
    // An estimate can link to a customer or (before conversion) directly to a
    // lead — resolve the recipient from whichever is present.
    const estimateContact = estimate?.customer ?? estimate?.lead ?? null;
    const recipient = estimate && estimateContact
      ? {
          email: estimateContact.email,
          name: "name" in estimateContact
            ? estimateContact.name
            : [estimateContact.firstName, estimateContact.lastName].filter(Boolean).join(" "),
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

    // If the owner disabled the FOLLOW_UP template, complete the follow-up
    // without sending so it doesn't retry on every dashboard visit.
    const savedTemplate = await db.messageTemplate.findFirst({
      where: { userId: followUp.userId, category: "FOLLOW_UP" },
      select: { enabled: true },
    });
    if (savedTemplate && !savedTemplate.enabled) {
      await db.followUp.update({
        where: { id: followUp.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      continue;
    }

    try {
      const delivered = await sendTemplateEmail(
        "FOLLOW_UP",
        recipient.email,
        recipient.name,
        {
          "{{business}}": recipient.business || "our team",
          "{{service}}": recipient.service,
          "{{expires}}": recipient.expires,
        },
        followUp.userId
      );
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
