import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
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
    recentActivity,
    // counts for summary bar
    newLeadsCount,
    followUpsDueCount,
    overdueFollowUpsCount,
    estimatesAwaitingCount,
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

    // Estimates awaiting response
    db.estimate.findMany({
      where: {
        userId,
        status: { in: ["SENT", "FOLLOW_UP_DUE"] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Recently updated opportunities (leads)
    db.lead.findMany({
      where: { userId },
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
      where: { userId, status: { in: ["SENT", "FOLLOW_UP_DUE"] } },
    }),
  ]);

  return NextResponse.json({
    newLeads,
    followUpsDueToday,
    overdueFollowUps,
    estimatesAwaiting,
    recentActivity,
    counts: {
      newLeads: newLeadsCount,
      followUpsDue: followUpsDueCount,
      overdueFollowUps: overdueFollowUpsCount,
      estimatesAwaiting: estimatesAwaitingCount,
    },
  });
}
