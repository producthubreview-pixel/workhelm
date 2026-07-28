"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  User,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  Trash2,
  DollarSign,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimateStatusBadge } from "@/components/estimates/estimate-status-badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime, formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type FollowUp = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  completedAt: string | null;
  notes: string | null;
};

type Estimate = {
  id: string;
  title: string;
  amount: number | null;
  status: string;
  declinedReason: string | null;
  createdAt: string;
  expiresAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  followUps: FollowUp[];
};

const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEstimate();
  }, [params.id]);

  async function fetchEstimate() {
    try {
      const res = await fetch(`/api/estimates/${params.id}`);
      if (res.ok) {
        setEstimate(await res.json());
      } else {
        toast({ title: "Estimate not found", variant: "destructive" });
        router.push("/app/estimates");
      }
    } catch {
      toast({ title: "Failed to load estimate", variant: "destructive" });
      router.push("/app/estimates");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setActionLoading(true);
    const res = await fetch(`/api/estimates/${params.id}/send`, {
      method: "PATCH",
    });
    if (res.ok) {
      const updated = await res.json();
      setEstimate((prev) => (prev ? { ...prev, ...updated } : prev));
      toast({ title: "Estimate marked as sent" });
    } else {
      toast({ title: "Failed to mark as sent", variant: "destructive" });
    }
    setActionLoading(false);
  }

  async function handleAccept() {
    setActionLoading(true);
    const res = await fetch(`/api/estimates/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEstimate((prev) => (prev ? { ...prev, ...updated } : prev));
      toast({ title: "Estimate accepted! 🎉" });
    } else {
      toast({ title: "Failed to accept estimate", variant: "destructive" });
    }
    setActionLoading(false);
  }

  async function handleDecline() {
    if (!declineReason.trim()) {
      toast({ title: "Please provide a reason for declining", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    const res = await fetch(`/api/estimates/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DECLINED", declinedReason: declineReason }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEstimate((prev) => (prev ? { ...prev, ...updated } : prev));
      setDeclineOpen(false);
      setDeclineReason("");
      toast({ title: "Estimate declined" });
    } else {
      toast({ title: "Failed to decline estimate", variant: "destructive" });
    }
    setActionLoading(false);
  }

  async function handleScheduleFollowUp() {
    const title = prompt("Follow-up title:");
    if (!title) return;
    const dueDate = prompt("Due date (YYYY-MM-DD):");
    if (!dueDate) return;

    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dueAt: dueDate,
        estimateId: estimate!.id,
        customerId: estimate!.customer.id,
      }),
    });

    if (res.ok) {
      toast({ title: "Follow-up scheduled" });
      fetchEstimate();
    } else {
      toast({ title: "Failed to schedule follow-up", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this estimate?")) return;
    const res = await fetch(`/api/estimates/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Estimate deleted" });
      router.push("/app/estimates");
    } else {
      toast({ title: "Failed to delete estimate", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div>
        <Link
          href="/app/estimates"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Estimates
        </Link>
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!estimate) return null;

  const canModify =
    estimate.status !== "ACCEPTED" &&
    estimate.status !== "DECLINED" &&
    estimate.status !== "EXPIRED";

  return (
    <div>
      {/* Back link + Actions */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/app/estimates"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Estimates
        </Link>
        <div className="flex gap-2">
          {canModify && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/app/estimates/${estimate.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
          {canModify && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{estimate.title}</h1>
            <Link
              href={`/app/customers/${estimate.customer.id}`}
              className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <User className="h-3 w-3" /> {estimate.customer.name}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <EstimateStatusBadge status={estimate.status} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {estimate.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSend}
              disabled={actionLoading}
            >
              <Send className="h-4 w-4 mr-1" /> Mark as Sent
            </Button>
          )}
          {(estimate.status === "SENT" ||
            estimate.status === "FOLLOW_UP_DUE") && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAccept}
                disabled={actionLoading}
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeclineOpen(true)}
                disabled={actionLoading}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" /> Decline
              </Button>
            </>
          )}
          {(estimate.status === "SENT" ||
            estimate.status === "FOLLOW_UP_DUE" ||
            estimate.status === "DRAFT") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleScheduleFollowUp}
            >
              <Calendar className="h-4 w-4 mr-1" /> Schedule Follow-Up
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Estimate Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Estimate Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Amount</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  {estimate.amount != null
                    ? estimate.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                <EstimateStatusBadge status={estimate.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Created</p>
                <p className="text-sm">{formatDateTime(estimate.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Expires</p>
                <p className="text-sm">
                  {estimate.expiresAt
                    ? formatDate(estimate.expiresAt)
                    : "No expiration"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Next Follow-Up
                </p>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {estimate.nextFollowUpAt
                    ? formatDate(estimate.nextFollowUpAt)
                    : "Not scheduled"}
                </p>
              </div>
              {estimate.status === "DECLINED" && estimate.declinedReason && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Declined Reason
                  </p>
                  <p className="text-sm text-red-700">{estimate.declinedReason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Customer
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={`/app/customers/${estimate.customer.id}`}
              className="font-medium text-primary hover:underline block"
            >
              {estimate.customer.name}
            </Link>
            {estimate.customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`tel:${estimate.customer.phone}`}
                  className="text-primary hover:underline"
                >
                  {estimate.customer.phone}
                </a>
              </div>
            )}
            {estimate.customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${estimate.customer.email}`}
                  className="text-primary hover:underline break-all"
                >
                  {estimate.customer.email}
                </a>
              </div>
            )}
            {!estimate.customer.phone && !estimate.customer.email && (
              <p className="text-sm text-gray-500">No contact info.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {estimate.notes && (
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-gray-900">Notes</h2>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                {estimate.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Follow-Ups */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Related Follow-Ups ({estimate.followUps.length})
            </h2>
          </CardHeader>
          <CardContent>
            {estimate.followUps.length === 0 ? (
              <p className="text-sm text-gray-500">
                No follow-ups for this estimate yet.
              </p>
            ) : (
              <div className="space-y-2">
                {estimate.followUps.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {f.title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        Due {formatDate(f.dueAt)}
                        {f.completedAt
                          ? ` • Completed ${formatDate(f.completedAt)}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      className={
                        FOLLOWUP_STATUS_COLORS[f.status] || "bg-gray-100"
                      }
                    >
                      {f.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decline Dialog */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Estimate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Why was this estimate declined? This will be saved for future reference.
            </p>
            <Textarea
              placeholder="e.g. Price too high, went with another contractor..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclineOpen(false);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={actionLoading || !declineReason.trim()}
            >
              {actionLoading ? "Declining..." : "Decline Estimate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
