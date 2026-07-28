import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Fetch all leads for this user
  const leads = await db.lead.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  // Group leads by status
  const columns: Record<string, typeof leads> = {};
  const statuses: LeadStatus[] = [
    "NEW",
    "CONTACTED",
    "ESTIMATE_NEEDED",
    "ESTIMATE_SENT",
    "FOLLOW_UP",
    "WON",
    "LOST",
  ];

  for (const status of statuses) {
    columns[status] = leads.filter((l) => l.status === status);
  }

  // Pipeline summary stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeStatuses: LeadStatus[] = [
    "NEW",
    "CONTACTED",
    "ESTIMATE_NEEDED",
    "ESTIMATE_SENT",
    "FOLLOW_UP",
  ];

  const pipelineLeads = leads.filter((l) =>
    activeStatuses.includes(l.status as LeadStatus)
  );
  const pipelineValue = pipelineLeads.reduce(
    (sum, l) => sum + (l.estimatedValue || 0),
    0
  );

  const totalLeads = leads.length;

  const wonThisMonth = leads.filter(
    (l) =>
      l.status === "WON" && new Date(l.updatedAt) >= startOfMonth
  ).length;

  const totalWon = leads.filter((l) => l.status === "WON").length;
  const totalLost = leads.filter((l) => l.status === "LOST").length;
  const conversionRate =
    totalWon + totalLost > 0
      ? Math.round((totalWon / (totalWon + totalLost)) * 100)
      : 0;

  return NextResponse.json({
    columns,
    summary: {
      pipelineValue,
      totalLeads,
      pipelineCount: pipelineLeads.length,
      wonThisMonth,
      conversionRate,
      totalWon,
      totalLost,
    },
  });
}
