import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendDueFollowUps } from "@/lib/follow-up-sender";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // Dashboard visits are the MVP trigger for due automated follow-ups. Keep
  // this best-effort so reporting still loads if an email provider is down.
  try {
    await sendDueFollowUps(userId);
  } catch (error) {
    console.error("Failed to process due follow-ups:", error);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    newLeads,
    followUpsDueToday,
    overdueFollowUps,
    estimatesAwaiting,
    leadsWithEstimates,
    recentActivity,
    // counts for summary bar
    newLeadsCount,
    followUpsDueCount,
    overdueFollowUpsCount,
    estimatesAwaitingCount,
    leadsWithEstimatesCount,
  ] = await Promise.all([
    // New leads not yet contacted
    db.lead.findMany({
      where: { userId, status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    // Follow-ups due today with related entities
    db.followUp.findMany({
      where: {
        userId,
        status: "OPEN",
        dueAt: { gte: now, lt: tomorrow },
      },
      include: {
        lead: { select: { firstName: true, lastName: true } },
        customer: { select: { name: true } },
        estimate: { select: { title: true } },
      },
      orderBy: { dueAt: "asc" },
    }),

    // Overdue follow-ups
    db.followUp.findMany({
      where: {
        userId,
        status: "OPEN",
        dueAt: { lt: now },
      },
      include: {
        lead: { select: { firstName: true, lastName: true } },
        customer: { select: { name: true } },
        estimate: { select: { title: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),

    // Estimates awaiting response — only those still linked to a lead or a
    // customer. Estimates with both links null are orphans (e.g. left over
    // from a lead deletion before the cascade was fixed) and show nowhere.
    db.estimate.findMany({
      where: {
        userId,
        status: { in: ["SENT", "FOLLOW_UP_DUE"] },
        OR: [{ leadId: { not: null } }, { customerId: { not: null } }],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Active leads with an estimated value (not yet terminal)
    db.lead.findMany({
      where: {
        userId,
        estimatedValue: { not: null },
        status: { notIn: ["WON", "LOST"] },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Recently updated opportunities (active leads only)
    db.lead.findMany({
      where: { userId, status: { notIn: ["WON", "LOST"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),

    // Counts
    db.lead.count({ where: { userId, status: "NEW" } }),
    db.followUp.count({
      where: { userId, status: "OPEN", dueAt: { gte: now, lt: tomorrow } },
    }),
    db.followUp.count({
      where: { userId, status: "OPEN", dueAt: { lt: now } },
    }),
    db.estimate.count({
      where: {
        userId,
        status: { in: ["SENT", "FOLLOW_UP_DUE"] },
        OR: [{ leadId: { not: null } }, { customerId: { not: null } }],
      },
    }),
    db.lead.count({
      where: { userId, estimatedValue: { not: null }, status: { notIn: ["WON", "LOST"] } },
    }),
  ]);

  const estimatesAwaitingResponse = [
    ...estimatesAwaiting.map((estimate) => ({ ...estimate, type: "estimate" as const })),
    ...leadsWithEstimates.map((lead) => ({ ...lead, type: "lead" as const })),
  ];

  return NextResponse.json({
    newLeads,
    followUpsDueToday,
    overdueFollowUps,
    estimatesAwaiting: estimatesAwaitingResponse,
    recentActivity,
    counts: {
      newLeads: newLeadsCount,
      followUpsDue: followUpsDueCount,
      overdueFollowUps: overdueFollowUpsCount,
      estimatesAwaiting: estimatesAwaitingCount + leadsWithEstimatesCount,
    },
  });
}
