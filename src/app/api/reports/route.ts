import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const startDateStr = req.nextUrl.searchParams.get("startDate");
  const endDateStr = req.nextUrl.searchParams.get("endDate");

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

  try {
    // Start with just lead counts to isolate the issue
    const totalLeads = await db.lead.count({ where: leadDateFilter });
    const leadsWon = await db.lead.count({ where: { ...leadDateFilter, status: "WON" } });
    const leadsLost = await db.lead.count({ where: { ...leadDateFilter, status: "LOST" } });

    const conversionRate =
      leadsWon + leadsLost > 0
        ? Math.round((leadsWon / (leadsWon + leadsLost)) * 100)
        : 0;

    try {
      var estimatesSent = await db.estimate.count({
        where: { ...estimateDateFilter, status: { in: ["SENT", "FOLLOW_UP_DUE", "ACCEPTED", "DECLINED"] } },
      });
      var estimatesAccepted = await db.estimate.count({ where: { ...estimateDateFilter, status: "ACCEPTED" } });
      var estimatesDeclined = await db.estimate.count({ where: { ...estimateDateFilter, status: "DECLINED" } });
    } catch (e) {
      console.error("Estimate query error:", e);
      var estimatesSent = 0;
      var estimatesAccepted = 0;
      var estimatesDeclined = 0;
    }

    try {
      var pipelineValueResult = await db.lead.aggregate({
        where: { userId, status: { notIn: ["WON", "LOST"] } },
        _sum: { estimatedValue: true },
      });
    } catch (e) {
      console.error("Pipeline value error:", e);
      var pipelineValueResult = { _sum: { estimatedValue: null } };
    }

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
    leadsWonPct:
      totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0,
    leadsLostPct:
      totalLeads > 0 ? Math.round((leadsLost / totalLeads) * 100) : 0,
  });
  } catch (err) {
    console.error("Reports error:", err);
    return NextResponse.json(
      { error: "Failed to generate reports", details: String(err) },
      { status: 500 }
    );
  }
}
