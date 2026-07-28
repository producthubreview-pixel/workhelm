"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Archive,
  ArchiveRestore,
  FileText,
  Calendar,
  Clock,
  UserPlus,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime, formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Estimate = {
  id: string;
  title: string;
  amount: number | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
};

type FollowUp = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  completedAt: string | null;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  serviceAddress: string | null;
  notes: string | null;
  isArchived: boolean;
  convertedFromLeadId: string | null;
  createdAt: string;
  updatedAt: string;
  estimates: Estimate[];
  followUps: FollowUp[];
  lead: { id: string; firstName: string; lastName: string | null } | null;
};

const ESTIMATE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  FOLLOW_UP_DUE: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-yellow-100 text-yellow-700",
};

const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${params.id}`);
      if (res.ok) {
        setCustomer(await res.json());
      } else {
        toast({ title: "Customer not found", variant: "destructive" });
        router.push("/app/customers");
      }
    } catch {
      toast({ title: "Failed to load customer", variant: "destructive" });
      router.push("/app/customers");
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    const res = await fetch(`/api/customers/${params.id}/archive`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setCustomer((prev) => (prev ? { ...prev, isArchived: updated.isArchived } : prev));
      toast({
        title: updated.isArchived ? "Customer archived" : "Customer restored",
      });
    } else {
      toast({ title: "Failed to update customer", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
    const res = await fetch(`/api/customers/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Customer deleted" });
      router.push("/app/customers");
    } else {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    }
  }

  // Build activity timeline
  function buildActivityTimeline(): { date: string; description: string }[] {
    const timeline: { date: string; description: string }[] = [];

    if (!customer) return timeline;

    // Customer created
    if (customer.convertedFromLeadId && customer.lead) {
      const leadName = [customer.lead.firstName, customer.lead.lastName]
        .filter(Boolean)
        .join(" ");
      timeline.push({
        date: customer.createdAt,
        description: `Converted from lead: ${leadName}`,
      });
    } else {
      timeline.push({
        date: customer.createdAt,
        description: "Customer created",
      });
    }

    // Estimate status changes (just created)
    customer.estimates.forEach((e) => {
      timeline.push({
        date: e.createdAt,
        description: `Estimate "${e.title}" created${e.amount ? ` for $${e.amount.toLocaleString()}` : ""}`,
      });
    });

    // Follow-up completions
    customer.followUps.forEach((f) => {
      if (f.completedAt) {
        timeline.push({
          date: f.completedAt,
          description: `Follow-up "${f.title}" completed`,
        });
      }
      timeline.push({
        date: f.dueAt,
        description: `Follow-up "${f.title}" ${f.status === "COMPLETED" ? "was due" : "scheduled"}`,
      });
    });

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  if (loading) {
    return (
      <div>
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!customer) return null;

  const timeline = buildActivityTimeline();

  return (
    <div>
      {/* Back link + Actions */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/app/customers/${customer.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive}>
            {customer.isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-1" /> Restore
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-1" /> Archive
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {customer.name}
              {customer.isArchived && (
                <Badge variant="outline" className="text-gray-400">Archived</Badge>
              )}
            </h1>
            {customer.lead && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <UserPlus className="h-3 w-3" />
                Converted from lead:{" "}
                <Link
                  href={`/app/leads/${customer.lead.id}`}
                  className="text-primary hover:underline"
                >
                  {[customer.lead.firstName, customer.lead.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${customer.email}`}
                  className="text-primary hover:underline break-all"
                >
                  {customer.email}
                </a>
              </div>
            )}
            {customer.serviceAddress && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{customer.serviceAddress}</span>
              </div>
            )}
            {!customer.phone && !customer.email && !customer.serviceAddress && (
              <p className="text-sm text-gray-500">No contact info available.</p>
            )}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm">{formatDateTime(customer.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm">{formatDateTime(customer.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Notes</h2>
          </CardHeader>
          <CardContent>
            {customer.notes ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                {customer.notes}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No notes yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Activity History</h2>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 pl-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 shrink-0 relative z-10" />
                      <div>
                        <p className="text-sm text-gray-700">{item.description}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(item.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Estimates */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Related Estimates ({customer.estimates.length})
            </h2>
          </CardHeader>
          <CardContent>
            {customer.estimates.length === 0 ? (
              <p className="text-sm text-gray-500">No estimates for this customer yet.</p>
            ) : (
              <div className="space-y-2">
                {customer.estimates.map((e) => (
                  <Link
                    key={e.id}
                    href={`/app/estimates`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{e.title}</p>
                      <p className="text-xs text-gray-500">
                        Created {formatDate(e.createdAt)}
                        {e.expiresAt ? ` • Expires ${formatDate(e.expiresAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {e.amount != null && (
                        <span className="text-sm font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {e.amount.toLocaleString()}
                        </span>
                      )}
                      <Badge className={ESTIMATE_STATUS_COLORS[e.status] || "bg-gray-100"}>
                        {e.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Follow-Ups */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Related Follow-Ups ({customer.followUps.length})
            </h2>
          </CardHeader>
          <CardContent>
            {customer.followUps.length === 0 ? (
              <p className="text-sm text-gray-500">No follow-ups for this customer yet.</p>
            ) : (
              <div className="space-y-2">
                {customer.followUps.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{f.title}</p>
                      <p className="text-xs text-gray-500">
                        Due {formatDate(f.dueAt)}
                        {f.completedAt ? ` • Completed ${formatDate(f.completedAt)}` : ""}
                      </p>
                    </div>
                    <Badge className={FOLLOWUP_STATUS_COLORS[f.status] || "bg-gray-100"}>
                      {f.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
