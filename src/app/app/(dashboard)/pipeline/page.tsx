"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronRight, DollarSign, Loader2, MoreHorizontal, RefreshCw, Target, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { STATUS_LABELS } from "@/lib/lead-schema";

const PIPELINE_STATUSES = ["NEW", "CONTACTED", "ESTIMATE_SENT", "WON", "LOST"] as const;
const DOTS: Record<string, string> = { NEW: "bg-blue-500", CONTACTED: "bg-cyan-500", ESTIMATE_SENT: "bg-orange-500", WON: "bg-green-500", LOST: "bg-red-500" };
const COLUMN_BG: Record<string, string> = { NEW: "bg-blue-50/50", CONTACTED: "bg-cyan-50/50", ESTIMATE_SENT: "bg-orange-50/50", WON: "bg-green-50/50", LOST: "bg-red-50/50" };

type LeadCard = { id: string; firstName: string; lastName: string | null; serviceRequested: string | null; status: string; priority: string; nextFollowUpAt: string | null; updatedAt: string; estimate: { amount: number | null; status: string } | null };
type Data = { columns: Record<string, LeadCard[]>; summary: { pipelineValue: number; pipelineCount: number; wonThisMonth: number; conversionRate: number } };

const currency = (n: number | null | undefined) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const date = (s: string | null) => s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const overdue = (s: string | null) => !!s && new Date(s) < new Date();
function daysInStage(s: string) { return Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / 86400000)); }

export default function PipelinePage() {
  const { toast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const fetchPipeline = useCallback(async () => { try { const r = await fetch("/api/pipeline"); if (!r.ok) throw new Error("Failed to load pipeline"); setData(await r.json()); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setLoading(false); } }, []);
  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);
  const move = async (id: string, status: string) => { const r = await fetch(`/api/leads/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (r.ok) { toast({ title: "Lead moved", description: `Lead moved to ${STATUS_LABELS[status]}` }); fetchPipeline(); } else toast({ title: "Error", description: "Could not move lead", variant: "destructive" }); };
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  if (error) return <div className="py-20 text-center text-red-600">{error} <button onClick={fetchPipeline} className="ml-2 underline">Retry</button></div>;
  if (!data) return null;
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Pipeline</h1><button onClick={fetchPipeline} className="inline-flex items-center gap-1.5 text-sm text-gray-500"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{([{ Icon: DollarSign, label: "Pipeline Value", value: currency(data.summary.pipelineValue) }, { Icon: Users, label: "Active Leads", value: data.summary.pipelineCount }, { Icon: Target, label: "Won This Month", value: data.summary.wonThisMonth }, { Icon: TrendingUp, label: "Conversion Rate", value: `${data.summary.conversionRate}%` }]).map(({ Icon, label, value }) => <div key={label} className="bg-white rounded-xl border p-4"><div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Icon className="h-4 w-4" />{label}</div><p className="text-xl font-bold text-gray-900">{value}</p></div>)}</div>
    <p className="text-xs text-gray-500">Leads move automatically as you contact them, send estimates, and record outcomes. Use the menu on a card only as a fallback.</p>
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[55vh]">{PIPELINE_STATUSES.map(status => <section key={status} className="flex-shrink-0 w-72"><button className="lg:pointer-events-none w-full flex items-center justify-between mb-3 px-1" onClick={() => setOpen(o => ({ ...o, [status]: !o[status] }))}><span className="flex items-center gap-2"><i className={`w-3 h-3 rounded-full ${DOTS[status]}`} /><b className="text-sm">{STATUS_LABELS[status]}</b><span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{data.columns[status]?.length || 0}</span></span><span className="lg:hidden">{open[status] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span></button><div className={`${COLUMN_BG[status]} rounded-xl border p-2 space-y-2 min-h-[200px] ${open[status] === false ? "hidden lg:block" : ""}`}>{(data.columns[status] || []).length ? data.columns[status].map(lead => <LeadCard key={lead.id} lead={lead} onMove={s => move(lead.id, s)} />) : <div className="text-center py-8 text-xs text-gray-400">No leads yet</div>}</div></section>)}</div>
  </div>;
}

function LeadCard({ lead, onMove }: { lead: LeadCard; onMove: (status: string) => void }) {
  const [menu, setMenu] = useState(false); const name = `${lead.firstName} ${lead.lastName || ""}`.trim(); const late = overdue(lead.nextFollowUpAt);
  return <div className="relative bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition"><Link href={`/app/leads/${lead.id}`} className="block pr-6"><p className="font-medium text-sm text-gray-900 truncate">{name || "Unnamed Lead"}</p><p className="text-xs text-gray-500 mt-0.5 truncate">{lead.serviceRequested || "Service not specified"}</p><div className="flex items-center justify-between mt-2 text-xs"><span className="text-gray-500">Estimate: <b className="text-gray-700">{currency(lead.estimate?.amount)}</b></span><span className="text-gray-400">{daysInStage(lead.updatedAt)}d in stage</span></div>{lead.nextFollowUpAt && <p className={`text-xs mt-1.5 ${late ? "text-red-600 font-medium" : "text-gray-500"}`}>{late && <AlertTriangle className="inline h-3 w-3 mr-1" />}{late ? "Overdue: " : "Follow-up: "}{date(lead.nextFollowUpAt)}</p>}</Link><div className="absolute top-2 right-2"><button aria-label="Quick move (fallback)" onClick={() => setMenu(!menu)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><MoreHorizontal className="h-4 w-4" /></button>{menu && <div className="absolute right-0 top-7 z-20 w-40 bg-white border rounded-lg shadow-lg py-1"><p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase">Fallback move</p>{PIPELINE_STATUSES.filter(s => s !== lead.status).map(s => <button key={s} onClick={() => { setMenu(false); onMove(s); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50">{STATUS_LABELS[s]}</button>)}</div>}</div></div>;
}
