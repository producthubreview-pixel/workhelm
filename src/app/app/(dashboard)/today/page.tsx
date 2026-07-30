"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Calendar, AlertTriangle, FileText,
  Phone, CheckCircle, Clock, XCircle, ArrowRight,
  Plus, ChevronRight, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/leads/status-badge";
import { LeadsUsageBanner } from "@/components/leads/leads-usage-banner";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/date-utils";

// ── Types ────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  serviceRequested: string | null;
  estimatedValue: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type FollowUpRel = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  notes: string | null;
  leadId: string | null;
  customerId: string | null;
  estimateId: string | null;
  lead: { firstName: string; lastName: string } | null;
  customer: { name: string } | null;
  estimate: { title: string } | null;
};

type EstimateRel = {
  id: string;
  title: string;
  amount: number | null;
  status: string;
  declinedReason: string | null;
  createdAt: string;
  expiresAt: string | null;
  customer: { id: string; name: string; phone: string | null; email: string | null };
};

type DashboardData = {
  newLeads: Lead[];
  followUpsDueToday: FollowUpRel[];
  overdueFollowUps: FollowUpRel[];
  estimatesAwaiting: EstimateRel[];
  recentActivity: Lead[];
  counts: {
    newLeads: number;
    followUpsDue: number;
    overdueFollowUps: number;
    estimatesAwaiting: number;
  };
};

// ── Helpers ──────────────────────────────────────────────────────────────

function getRelativeName(f: FollowUpRel): string {
  if (f.lead) return `${f.lead.firstName} ${f.lead.lastName || ""}`.trim();
  if (f.customer) return f.customer.name;
  if (f.estimate) return f.estimate.title;
  return "—";
}

function getRelatedLink(f: FollowUpRel): string | null {
  if (f.leadId) return `/app/leads/${f.leadId}`;
  if (f.customerId) return `/app/customers/${f.customerId}`;
  if (f.estimateId) return `/app/estimates/${f.estimateId}`;
  return null;
}

function formatCurrency(val: number | null): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return isToday ? time : `${formatDate(dateStr)} ${time}`;
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [followUpDialog, setFollowUpDialog] = useState<{
    open: boolean; leadId?: string; estimateId?: string; customerId?: string;
  }>({ open: false });
  const [followUpForm, setFollowUpForm] = useState({ title: "", dueAt: "", notes: "" });

  const [declineDialog, setDeclineDialog] = useState<{ open: boolean; estimateId: string }>({ open: false, estimateId: "" });
  const [declineReason, setDeclineReason] = useState("");

  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; followUpId: string }>({ open: false, followUpId: "" });
  const [rescheduleDate, setRescheduleDate] = useState("");

  // Track which items are being actioned for loading states
  const [actioning, setActioning] = useState<Set<string>>(new Set());

  // ── Fetch dashboard data ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/today");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      toast({ title: "Error", description: "Failed to load dashboard", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────────────────

  const markContacted = async (leadId: string) => {
    setActioning((prev) => new Set(prev).add(leadId));
    // Optimistic removal from newLeads
    const prevData = data;
    if (data) {
      setData({
        ...data,
        newLeads: data.newLeads.filter((l) => l.id !== leadId),
        counts: { ...data.counts, newLeads: data.counts.newLeads - 1 },
      });
    }
    try {
      await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONTACTED" }),
      });
      toast({ title: "Lead contacted", description: "Status updated to Contacted" });
    } catch {
      setData(prevData);
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    } finally {
      setActioning((prev) => { const s = new Set(prev); s.delete(leadId); return s; });
    }
  };

  const completeFollowUp = async (followUpId: string) => {
    setActioning((prev) => new Set(prev).add(followUpId));
    const prevData = data;
    if (data) {
      setData({
        ...data,
        followUpsDueToday: data.followUpsDueToday.filter((f) => f.id !== followUpId),
        overdueFollowUps: data.overdueFollowUps.filter((f) => f.id !== followUpId),
        counts: {
          ...data.counts,
          followUpsDue: Math.max(0, data.counts.followUpsDue - (data.followUpsDueToday.some(f => f.id === followUpId) ? 1 : 0)),
          overdueFollowUps: Math.max(0, data.counts.overdueFollowUps - (data.overdueFollowUps.some(f => f.id === followUpId) ? 1 : 0)),
        },
      });
    }
    try {
      await fetch(`/api/followups/${followUpId}/complete`, { method: "PATCH" });
      toast({ title: "Follow-up completed", description: "Nice work!" });
    } catch {
      setData(prevData);
      toast({ title: "Error", description: "Failed to complete follow-up", variant: "destructive" });
    } finally {
      setActioning((prev) => { const s = new Set(prev); s.delete(followUpId); return s; });
    }
  };

  const rescheduleFollowUp = async (followUpId: string, newDate: string) => {
    setActioning((prev) => new Set(prev).add(followUpId));
    const prevData = data;
    if (data) {
      setData({
        ...data,
        followUpsDueToday: data.followUpsDueToday.filter((f) => f.id !== followUpId),
        overdueFollowUps: data.overdueFollowUps.filter((f) => f.id !== followUpId),
      });
    }
    try {
      await fetch(`/api/followups/${followUpId}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueAt: newDate }),
      });
      toast({ title: "Follow-up rescheduled", description: `Moved to ${formatDate(newDate)}` });
    } catch {
      setData(prevData);
      toast({ title: "Error", description: "Failed to reschedule", variant: "destructive" });
    } finally {
      setActioning((prev) => { const s = new Set(prev); s.delete(followUpId); return s; });
    }
  };

  const createFollowUp = async () => {
    if (!followUpForm.title || !followUpForm.dueAt) {
      toast({ title: "Missing fields", description: "Title and date are required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: followUpForm.title,
          dueAt: followUpForm.dueAt,
          leadId: followUpDialog.leadId,
          estimateId: followUpDialog.estimateId,
          customerId: followUpDialog.customerId,
          notes: followUpForm.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Follow-up created", description: "Scheduled successfully" });
      setFollowUpDialog({ open: false });
      setFollowUpForm({ title: "", dueAt: "", notes: "" });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to create follow-up", variant: "destructive" });
    }
  };

  const markEstimate = async (estimateId: string, status: "ACCEPTED" | "DECLINED", reason?: string) => {
    setActioning((prev) => new Set(prev).add(estimateId));
    const prevData = data;
    if (data) {
      setData({
        ...data,
        estimatesAwaiting: data.estimatesAwaiting.filter((e) => e.id !== estimateId),
        counts: { ...data.counts, estimatesAwaiting: Math.max(0, data.counts.estimatesAwaiting - 1) },
      });
    }
    try {
      await fetch(`/api/estimates/${estimateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, declinedReason: reason }),
      });
      toast({
        title: status === "ACCEPTED" ? "Estimate accepted! 🎉" : "Estimate declined",
        description: status === "ACCEPTED" ? "Convert to a customer to track the job" : reason || "Estimate marked as declined",
      });
      setDeclineDialog({ open: false, estimateId: "" });
      setDeclineReason("");
    } catch {
      setData(prevData);
      toast({ title: "Error", description: "Failed to update estimate", variant: "destructive" });
    } finally {
      setActioning((prev) => { const s = new Set(prev); s.delete(estimateId); return s; });
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Unable to load dashboard.</p>
        <Button variant="outline" className="mt-4" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const { newLeads, followUpsDueToday, overdueFollowUps, estimatesAwaiting, recentActivity, counts } = data;

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = [
    { label: "New Leads", value: counts.newLeads, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Follow-Ups Due", value: counts.followUpsDue, icon: Calendar, color: "text-amber-600 bg-amber-50" },
    { label: "Overdue", value: counts.overdueFollowUps, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
    { label: "Estimates Pending", value: counts.estimatesAwaiting, icon: FileText, color: "text-green-600 bg-green-50" },
  ];

  // ── Quick-action convenience ───────────────────────────────────────────

  const openFollowUpDialog = (opts: { leadId?: string; estimateId?: string; customerId?: string }) => {
    setFollowUpForm({ title: "", dueAt: "", notes: "" });
    setFollowUpDialog({ open: true, ...opts });
  };

  const openRescheduleDialog = (followUpId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(tomorrow.toISOString().split("T")[0]);
    setRescheduleDialog({ open: true, followUpId });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Today</h1>

      {/* Leads Usage Banner (Free plan only) */}
      <LeadsUsageBanner />

      {/* ─── Stats Summary Bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Main Grid ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">

        {/* ─── New Leads ──────────────────────────────────────────── */}
        <SectionCard
          title="New Leads"
          icon={<Users className="h-5 w-5" />}
          colorClass="border-blue-200"
          headerColor="text-blue-700"
          count={newLeads.length}
          viewAllLink="/app/leads?status=NEW"
          emptyMessage="No new leads — looking good!"
        >
          {newLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onContacted={() => markContacted(lead.id)}
              onScheduleFollowUp={() => openFollowUpDialog({ leadId: lead.id })}
              isActioning={actioning.has(lead.id)}
            />
          ))}
        </SectionCard>

        {/* ─── Overdue Follow-Ups ──────────────────────────────────── */}
        <SectionCard
          title="Overdue Follow-Ups"
          icon={<AlertTriangle className="h-5 w-5" />}
          colorClass="border-red-300"
          headerColor="text-red-700"
          count={overdueFollowUps.length}
          viewAllLink="/app/follow-ups"
          emptyMessage="No overdue follow-ups — you're on top of it!"
          highlight={true}
        >
          {overdueFollowUps.map((f) => (
            <FollowUpCard
              key={f.id}
              followUp={f}
              highlight
              onComplete={() => completeFollowUp(f.id)}
              onReschedule={() => openRescheduleDialog(f.id)}
              isActioning={actioning.has(f.id)}
            />
          ))}
        </SectionCard>

        {/* ─── Follow-Ups Due Today ────────────────────────────────── */}
        <SectionCard
          title="Follow-Ups Due Today"
          icon={<Calendar className="h-5 w-5" />}
          colorClass="border-amber-200"
          headerColor="text-amber-700"
          count={followUpsDueToday.length}
          viewAllLink="/app/follow-ups"
          emptyMessage="Nothing due today — enjoy the calm!"
        >
          {followUpsDueToday.map((f) => (
            <FollowUpCard
              key={f.id}
              followUp={f}
              onComplete={() => completeFollowUp(f.id)}
              onReschedule={() => openRescheduleDialog(f.id)}
              isActioning={actioning.has(f.id)}
            />
          ))}
        </SectionCard>

        {/* ─── Estimates Awaiting Response ─────────────────────────── */}
        <SectionCard
          title="Estimates Awaiting Response"
          icon={<FileText className="h-5 w-5" />}
          colorClass="border-green-200"
          headerColor="text-green-700"
          count={estimatesAwaiting.length}
          viewAllLink="/app/estimates"
          emptyMessage="No estimates awaiting response."
        >
          {estimatesAwaiting.map((est) => (
            <EstimateCard
              key={est.id}
              estimate={est}
              onAccept={() => markEstimate(est.id, "ACCEPTED")}
              onDecline={() => { setDeclineDialog({ open: true, estimateId: est.id }); setDeclineReason(""); }}
              onScheduleFollowUp={() => openFollowUpDialog({ estimateId: est.id, customerId: est.customer.id })}
              isActioning={actioning.has(est.id)}
            />
          ))}
        </SectionCard>

        {/* ─── Recent Activity ─────────────────────────────────────── */}
        <SectionCard
          title="Recently Updated Opportunities"
          icon={<RefreshCw className="h-5 w-5" />}
          colorClass="border-gray-200"
          headerColor="text-gray-700"
          count={recentActivity.length}
          viewAllLink="/app/leads"
          emptyMessage="No leads yet — create your first lead!"
          fullWidth
        >
          {recentActivity.map((lead) => (
            <Link
              key={lead.id}
              href={`/app/leads/${lead.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border-b last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {lead.firstName} {lead.lastName || ""}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {lead.serviceRequested || "No service specified"} · {formatDate(lead.updatedAt)}
                </p>
              </div>
              <StatusBadge status={lead.status} />
              <ChevronRight className="h-4 w-4 text-gray-300 ml-2 flex-shrink-0" />
            </Link>
          ))}
        </SectionCard>
      </div>

      {/* ─── Create Follow-Up Dialog ─────────────────────────────────── */}
      <Dialog open={followUpDialog.open} onOpenChange={(o) => setFollowUpDialog({ ...followUpDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="fu-title">Title</Label>
              <Input
                id="fu-title"
                placeholder="Call to discuss estimate"
                value={followUpForm.title}
                onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fu-date">Due Date</Label>
              <Input
                id="fu-date"
                type="datetime-local"
                value={followUpForm.dueAt}
                onChange={(e) => setFollowUpForm({ ...followUpForm, dueAt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fu-notes">Notes (optional)</Label>
              <Textarea
                id="fu-notes"
                placeholder="What to discuss..."
                value={followUpForm.notes}
                onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpDialog({ open: false })}>Cancel</Button>
            <Button onClick={createFollowUp}>Create Follow-Up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reschedule Dialog ────────────────────────────────────────── */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(o) => { if (!o) setRescheduleDialog({ open: false, followUpId: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex flex-wrap gap-2">
              {(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const buttons = [
                  { label: "Tomorrow", date: tomorrow.toISOString().split("T")[0] },
                  { label: "Next Week", date: nextWeek.toISOString().split("T")[0] },
                ];
                return buttons.map((b) => (
                  <Button
                    key={b.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setRescheduleDate(b.date)}
                  >
                    {b.label}
                  </Button>
                ));
              })()}
            </div>
            <div>
              <Label htmlFor="rs-date">New Date</Label>
              <Input
                id="rs-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, followUpId: "" })}>Cancel</Button>
            <Button onClick={() => {
              rescheduleFollowUp(rescheduleDialog.followUpId, rescheduleDate);
              setRescheduleDialog({ open: false, followUpId: "" });
            }}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Decline Estimate Dialog ───────────────────────────────────── */}
      <Dialog open={declineDialog.open} onOpenChange={(o) => setDeclineDialog({ ...declineDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Estimate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="decline-reason">Reason (optional)</Label>
              <Textarea
                id="decline-reason"
                placeholder="e.g., Went with another quote, budget constraints..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeclineDialog({ open: false, estimateId: "" }); setDeclineReason(""); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => markEstimate(declineDialog.estimateId, "DECLINED", declineReason || undefined)}>
              Mark Declined
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  colorClass,
  headerColor,
  count,
  viewAllLink,
  emptyMessage,
  highlight = false,
  fullWidth = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  headerColor: string;
  count: number;
  viewAllLink: string;
  emptyMessage: string;
  highlight?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={`border shadow-none ${colorClass} ${fullWidth ? "lg:col-span-2" : ""} ${highlight ? "border-red-300 bg-red-50/30" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={headerColor}>{icon}</span>
            <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
            <Badge variant="secondary" className="ml-1">{count}</Badge>
          </div>
          <Link href={viewAllLink} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {count === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function LeadCard({
  lead,
  onContacted,
  onScheduleFollowUp,
  isActioning,
}: {
  lead: Lead;
  onContacted: () => void;
  onScheduleFollowUp: () => void;
  isActioning: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border bg-white hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/app/leads/${lead.id}`} className="font-medium text-sm text-gray-900 hover:text-primary truncate">
          {lead.firstName} {lead.lastName || ""}
        </Link>
        <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(lead.createdAt)}</span>
      </div>
      {lead.serviceRequested && (
        <p className="text-xs text-gray-500 mb-1">{lead.serviceRequested}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        {lead.estimatedValue != null && (
          <span className="font-medium text-gray-600">{formatCurrency(lead.estimatedValue)}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
            <Phone className="h-3 w-3" /> Call
          </a>
        )}
        <button
          onClick={onContacted}
          disabled={isActioning}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
        >
          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Contacted
        </button>
        <button
          onClick={onScheduleFollowUp}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
        >
          <Calendar className="h-3 w-3" /> Follow-Up
        </button>
      </div>
    </div>
  );
}

function FollowUpCard({
  followUp,
  highlight = false,
  onComplete,
  onReschedule,
  isActioning,
}: {
  followUp: FollowUpRel;
  highlight?: boolean;
  onComplete: () => void;
  onReschedule: () => void;
  isActioning: boolean;
}) {
  const relatedLink = getRelatedLink(followUp);
  const relatedName = getRelativeName(followUp);

  return (
    <div className={`p-3 rounded-lg border bg-white hover:shadow-sm transition ${highlight ? "border-l-4 border-l-red-400" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{followUp.title}</p>
          <p className="text-xs text-gray-500">
            {relatedLink ? (
              <Link href={relatedLink} className="hover:text-primary underline-offset-2 hover:underline">
                {relatedName}
              </Link>
            ) : relatedName}
            {" · "}
            <span className={highlight ? "text-red-600 font-medium" : ""}>{formatTime(followUp.dueAt)}</span>
          </p>
        </div>
      </div>
      {followUp.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{followUp.notes}</p>}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button
          onClick={onComplete}
          disabled={isActioning}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
        >
          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Complete
        </button>
        <button
          onClick={onReschedule}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
        >
          <Clock className="h-3 w-3" /> Reschedule
        </button>
      </div>
    </div>
  );
}

function EstimateCard({
  estimate,
  onAccept,
  onDecline,
  onScheduleFollowUp,
  isActioning,
}: {
  estimate: EstimateRel;
  onAccept: () => void;
  onDecline: () => void;
  onScheduleFollowUp: () => void;
  isActioning: boolean;
}) {
  const isExpiringSoon = estimate.expiresAt
    ? new Date(estimate.expiresAt) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className={`p-3 rounded-lg border bg-white hover:shadow-sm transition ${isExpiringSoon ? "border-l-4 border-l-amber-400" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{estimate.title}</p>
          <p className="text-xs text-gray-500">
            {estimate.customer.name}
            {estimate.amount != null && ` · ${formatCurrency(estimate.amount)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <span>Sent {formatDate(estimate.createdAt)}</span>
        {estimate.expiresAt && (
          <span className={isExpiringSoon ? "text-amber-600 font-medium" : ""}>
            · Expires {formatDate(estimate.expiresAt)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={onAccept}
          disabled={isActioning}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
        >
          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Accept
        </button>
        <button
          onClick={onDecline}
          disabled={isActioning}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
        >
          <XCircle className="h-3 w-3" /> Decline
        </button>
        <button
          onClick={onScheduleFollowUp}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
        >
          <Calendar className="h-3 w-3" /> Follow-Up
        </button>
      </div>
    </div>
  );
}
