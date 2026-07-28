import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  let startDate: Date;
  let endDate: Date;

  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
    // Set endDate to end of day
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default: this month
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const leadDateFilter = {
    userId,
    createdAt: { gte: startDate, lte: endDate },
  };

  const estimateDateFilter = {
    userId,
    createdAt: { gte: startDate, lte: endDate },
  };

  const followUpDateFilter = {
    userId,
    createdAt: { gte: startDate, lte: endDate },
  };

  const [
    totalLeads,
    leadsWon,
    leadsLost,
    estimatesSent,
    estimatesAccepted,
    estimatesDeclined,
    pipelineValueResult,
    followUpsCompleted,
    totalFollowUps,
    overdueFollowUps,
  ] = await Promise.all([
    // Total Leads
    db.lead.count({ where: leadDateFilter }),

    // Leads Won
    db.lead.count({
      where: { ...leadDateFilter, status: "WON" },
    }),

    // Leads Lost
    db.lead.count({
      where: { ...leadDateFilter, status: "LOST" },
    }),

    // Estimates Sent
    db.estimate.count({
      where: {
        ...estimateDateFilter,
        status: { in: ["SENT", "FOLLOW_UP_DUE", "ACCEPTED", "DECLINED"] },
      },
    }),

    // Estimates Accepted
    db.estimate.count({
      where: { ...estimateDateFilter, status: "ACCEPTED" },
    }),

    // Estimates Declined
    db.estimate.count({
      where: { ...estimateDateFilter, status: "DECLINED" },
    }),

    // Pipeline Value: sum of estimatedValue for leads NOT won/lost
    db.lead.aggregate({
      where: {
        userId,
        status: { notIn: ["WON", "LOST"] },
      },
      _sum: { estimatedValue: true },
    }),

    // Follow-Ups Completed
    db.followUp.count({
      where: { ...followUpDateFilter, status: "COMPLETED" },
    }),

    // Total Follow-Ups in period
    db.followUp.count({ where: followUpDateFilter }),

    // Overdue Follow-Ups: OPEN and dueAt < now
    db.followUp.count({
      where: {
        userId,
        status: "OPEN",
        dueAt: { lt: new Date() },
      },
    }),
  ]);

  // Derived metrics
  const conversionRate =
    leadsWon + leadsLost > 0
      ? Math.round((leadsWon / (leadsWon + leadsLost)) * 100)
      : 0;

  const followUpCompletionRate =
    totalFollowUps > 0
      ? Math.round((followUpsCompleted / totalFollowUps) * 100)
      : 0;

  const pipelineValue = pipelineValueResult._sum.estimatedValue ?? 0;

  return NextResponse.json({
    totalLeads,
    leadsWon,
    leadsLost,
    conversionRate,
    estimatesSent,
    estimatesAccepted,
    estimatesDeclined,
    estimatesAcceptedPct:
      estimatesSent > 0 ? Math.round((estimatesAccepted / estimatesSent) * 100) : 0,
    estimatesDeclinedPct:
      estimatesSent > 0 ? Math.round((estimatesDeclined / estimatesSent) * 100) : 0,
    pipelineValue,
    followUpsCompleted,
    overdueFollowUps,
    totalFollowUps,
    followUpCompletionRate,
    leadsWonPct:
      totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0,
    leadsLostPct:
      totalLeads > 0 ? Math.round((leadsLost / totalLeads) * 100) : 0,
  });
}
