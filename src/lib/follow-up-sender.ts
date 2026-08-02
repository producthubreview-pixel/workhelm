import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { DEFAULT_TEMPLATES, fillTemplate } from "@/lib/template-defaults";

/** Sends due estimate follow-ups for one owner. Failed sends remain open for retry. */
export async function sendDueFollowUps(userId?: string): Promise<{ processed: number; sent: number }> {
  const followUps = await db.followUp.findMany({
    where: {
      status: "OPEN",
      dueAt: { lte: new Date() },
      ...(userId ? { userId } : {}),
      estimateId: { not: null },
    },
    include: {
      estimate: {
        include: {
          customer: { select: { name: true, email: true } },
          user: { select: { businessName: true } },
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  let sent = 0;
  for (const followUp of followUps) {
    const estimate = followUp.estimate;
    if (!estimate?.customer.email) continue;

    const category = followUp.templateCategory === "FOLLOW_UP_2" ? "FOLLOW_UP_2" : "FOLLOW_UP_1";
    try {
      const savedTemplate = await db.messageTemplate.findFirst({
        where: { userId: followUp.userId, category },
      });
      const template = savedTemplate || DEFAULT_TEMPLATES.find((item) => item.category === category)!;
      const values = {
        "{{name}}": estimate.customer.name,
        "{{business}}": estimate.user.businessName || "our team",
        "{{service}}": estimate.title,
        "{{expires}}": estimate.expiresAt ? estimate.expiresAt.toLocaleDateString() : "the stated expiration date",
      };
      const delivered = await sendEmail({
        to: estimate.customer.email,
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
