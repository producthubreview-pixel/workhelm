"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, PriorityBadge } from "@/components/leads/status-badge";
import { LeadsUsageBanner } from "@/components/leads/leads-usage-banner";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/date-utils";

type Lead = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  serviceAddress: string | null;
  state: string | null;
  zip: string | null;
  serviceRequested: string | null;
  estimatedValue: number | null;
  source: string | null;
  status: string;
  priority: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast({ title: `Lead marked as ${status.replace(/_/g, " ")}` });
    } else {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Lead deleted" });
    } else {
      toast({ title: "Failed to delete lead", variant: "destructive" });
    }
  }

  const fullName = (lead: Lead) =>
    [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Link href="/app/leads/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </Link>
      </div>

      {/* Leads Usage Banner (Free plan only) */}
      <LeadsUsageBanner />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search name, phone, email, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="ESTIMATE_NEEDED">Estimate Needed</SelectItem>
            <SelectItem value="ESTIMATE_SENT">Estimate Sent</SelectItem>
            <SelectItem value="FOLLOW_UP">Follow-Up</SelectItem>
            <SelectItem value="WON">Won</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Loading leads...
        </div>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-lg text-gray-500 mb-4">No leads yet.</p>
          <Link href="/app/leads/new">
            <Button className="gap-1">
              <Plus className="h-4 w-4" /> Add Your First Lead
            </Button>
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && leads.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Est. Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Contacted</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Next Follow-Up</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/app/leads/${lead.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{fullName(lead)}</p>
                      {lead.email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">
                      {lead.serviceRequested || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {lead.estimatedValue != null
                        ? `$${lead.estimatedValue.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {lead.lastContactedAt
                        ? formatDate(lead.lastContactedAt)
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {lead.nextFollowUpAt
                        ? formatDate(lead.nextFollowUpAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1 rounded hover:bg-gray-200">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/app/leads/${lead.id}/edit`); }}>
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {lead.status !== "CONTACTED" && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, "CONTACTED"); }}>
                              <MessageSquare className="h-4 w-4" /> Mark Contacted
                            </DropdownMenuItem>
                          )}
                          {lead.status !== "WON" && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, "WON"); }}>
                              <CheckCircle className="h-4 w-4" /> Mark Won
                            </DropdownMenuItem>
                          )}
                          {lead.status !== "LOST" && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, "LOST"); }}>
                              <XCircle className="h-4 w-4" /> Mark Lost
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition"
                onClick={() => router.push(`/app/leads/${lead.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{fullName(lead)}</p>
                    {lead.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </p>
                    )}
                    {lead.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded hover:bg-gray-100">
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/app/leads/${lead.id}/edit`); }}>
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {lead.status !== "CONTACTED" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, "CONTACTED"); }}>
                          <MessageSquare className="h-4 w-4" /> Mark Contacted
                        </DropdownMenuItem>
                      )}
                      {lead.status !== "WON" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, "WON"); }}>
                          <CheckCircle className="h-4 w-4" /> Mark Won
                        </DropdownMenuItem>
                      )}
                      {lead.status !== "LOST" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, "LOST"); }}>
                          <XCircle className="h-4 w-4" /> Mark Lost
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                </div>

                {lead.serviceRequested && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-gray-400">Service:</span> {lead.serviceRequested}
                  </p>
                )}
                {(lead.serviceAddress || lead.state || lead.zip) && (
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    {[lead.serviceAddress, [lead.state, lead.zip].filter(Boolean).join(" ")]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                  <span>
                    {lead.estimatedValue != null
                      ? `$${lead.estimatedValue.toLocaleString()}`
                      : "No estimate"}
                  </span>
                  <span>
                    {lead.nextFollowUpAt ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Next: {formatDate(lead.nextFollowUpAt)}
                      </span>
                    ) : (
                      "No follow-up"
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
