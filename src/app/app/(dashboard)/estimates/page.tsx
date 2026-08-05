"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
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
import { EstimateStatusBadge } from "@/components/estimates/estimate-status-badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/date-utils";

type Estimate = {
  id: string;
  title: string;
  amount: number | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  customer: { id: string; name: string } | null;
  lead: { id: string; firstName: string; lastName: string | null } | null;
  followUpCount: number;
};

function estimateContactName(est: Estimate): string {
  if (est.customer) return est.customer.name;
  if (est.lead) return [est.lead.firstName, est.lead.lastName].filter(Boolean).join(" ");
  return "—";
}

export default function EstimatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/estimates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEstimates(data);
      }
    } catch (err) {
      console.error("Failed to fetch estimates:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  async function handleSend(id: string) {
    const res = await fetch(`/api/estimates/${id}/send`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setEstimates((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast({ title: "Estimate marked as sent" });
    } else {
      toast({ title: "Failed to mark as sent", variant: "destructive" });
    }
  }

  async function handleAccept(id: string) {
    const res = await fetch(`/api/estimates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEstimates((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
      toast({ title: "Estimate accepted" });
    } else {
      toast({ title: "Failed to accept estimate", variant: "destructive" });
    }
  }

  async function handleDecline(id: string) {
    const reason = prompt("Reason for declining (optional):");
    const res = await fetch(`/api/estimates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DECLINED", declinedReason: reason || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEstimates((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
      toast({ title: "Estimate declined" });
    } else {
      toast({ title: "Failed to decline estimate", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this estimate?")) return;
    const res = await fetch(`/api/estimates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEstimates((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Estimate deleted" });
    } else {
      toast({ title: "Failed to delete estimate", variant: "destructive" });
    }
  }

  const canModify = (status: string) =>
    status !== "ACCEPTED" && status !== "DECLINED" && status !== "EXPIRED";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
        <Link href="/app/estimates/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Estimate
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search title, lead or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="FOLLOW_UP_DUE">Follow-Up Due</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Loading estimates...
        </div>
      )}

      {/* Empty State */}
      {!loading && estimates.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-lg text-gray-500 mb-4">No estimates yet.</p>
          <Link href="/app/estimates/new">
            <Button className="gap-1">
              <Plus className="h-4 w-4" /> Create Your First Estimate
            </Button>
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && estimates.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Expires
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Follow-Up
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {estimates.map((est) => (
                  <tr
                    key={est.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/app/estimates/${est.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{est.title}</p>
                      {est.notes && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">
                          {est.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {estimateContactName(est)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {est.amount != null ? (
                        <span className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />$
                          {est.amount.toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EstimateStatusBadge status={est.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(est.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {est.expiresAt ? formatDate(est.expiresAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {est.nextFollowUpAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{" "}
                          {formatDate(est.nextFollowUpAt)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="p-1 rounded hover:bg-gray-200">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/app/estimates/${est.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {est.status === "DRAFT" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSend(est.id);
                              }}
                            >
                              <Send className="h-4 w-4" /> Mark Sent
                            </DropdownMenuItem>
                          )}
                          {(est.status === "SENT" ||
                            est.status === "FOLLOW_UP_DUE") && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(est.id);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" /> Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecline(est.id);
                                }}
                              >
                                <XCircle className="h-4 w-4" /> Decline
                              </DropdownMenuItem>
                            </>
                          )}
                          {canModify(est.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(est.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
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
            {estimates.map((est) => (
              <div
                key={est.id}
                className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition"
                onClick={() => router.push(`/app/estimates/${est.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {est.title}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3" /> {estimateContactName(est)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="p-1 rounded hover:bg-gray-100 shrink-0">
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/estimates/${est.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {est.status === "DRAFT" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend(est.id);
                          }}
                        >
                          <Send className="h-4 w-4" /> Mark Sent
                        </DropdownMenuItem>
                      )}
                      {(est.status === "SENT" ||
                        est.status === "FOLLOW_UP_DUE") && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(est.id);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" /> Accept
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecline(est.id);
                            }}
                          >
                            <XCircle className="h-4 w-4" /> Decline
                          </DropdownMenuItem>
                        </>
                      )}
                      {canModify(est.status) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(est.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <EstimateStatusBadge status={est.status} />
                  {est.amount != null && (
                    <span className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />$
                      {est.amount.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                  <span>{formatDate(est.createdAt)}</span>
                  <span>
                    {est.nextFollowUpAt ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{" "}
                        {formatDate(est.nextFollowUpAt)}
                      </span>
                    ) : est.expiresAt ? (
                      <span>Expires {formatDate(est.expiresAt)}</span>
                    ) : (
                      ""
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
