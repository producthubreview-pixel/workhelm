import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

const PIPELINE_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "ESTIMATE_SENT", "WON", "LOST"];
const ACTIVE_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "ESTIMATE_SENT"];
const PENDING_ESTIMATE_STATUSES = ["DRAFT", "SENT", "FOLLOW_UP_DUE"] as const;

function displayStatus(status: LeadStatus): LeadStatus {
  if (status === "ESTIMATE_NEEDED") return "CONTACTED";
  if (status === "FOLLOW_UP") return "ESTIMATE_SENT";
  return status;
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await db.lead.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { customer: { include: { estimates: true } } },
  });

  const cards = leads.map((lead) => {
    const estimates = lead.customer?.estimates ?? [];
    const pendingEstimates = estimates.filter((estimate) =>
      PENDING_ESTIMATE_STATUSES.includes(estimate.status as (typeof PENDING_ESTIMATE_STATUSES)[number])
    );
    const highestEstimate = [...pendingEstimates]
      .filter((estimate) => estimate.amount != null)
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0];
    return {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      serviceRequested: lead.serviceRequested,
      status: displayStatus(lead.status),
      priority: lead.priority,
      nextFollowUpAt: lead.nextFollowUpAt,
      source: lead.source,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      estimate: highestEstimate
        ? { id: highestEstimate.id, amount: highestEstimate.amount, status: highestEstimate.status }
        : null,
    };
  });

  const columns: Record<string, typeof cards> = {};
  for (const status of PIPELINE_STATUSES) columns[status] = cards.filter((lead) => lead.status === status);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeLeads = cards.filter((lead) => ACTIVE_STATUSES.includes(lead.status));
  const pipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.estimate?.amount ?? 0), 0);
  const wonThisMonth = cards.filter((lead) => lead.status === "WON" && new Date(lead.updatedAt) >= startOfMonth).length;
  const totalWon = cards.filter((lead) => lead.status === "WON").length;
  const totalLost = cards.filter((lead) => lead.status === "LOST").length;

  return NextResponse.json({
    columns,
    summary: {
      pipelineValue,
      totalLeads: cards.length,
      pipelineCount: activeLeads.length,
      wonThisMonth,
      conversionRate: totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0,
      totalWon,
      totalLost,
    },
  });
}
