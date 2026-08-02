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
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  PlusCircle,
  Trash2,
  DollarSign,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, PriorityBadge } from "@/components/leads/status-badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/date-utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  async function fetchLead() {
    try {
      const res = await fetch(`/api/leads/${params.id}`);
      if (res.ok) {
        setLead(await res.json());
      } else {
        toast({ title: "Lead not found", variant: "destructive" });
        router.push("/app/leads");
      }
    } catch {
      toast({ title: "Failed to load lead", variant: "destructive" });
      router.push("/app/leads");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/leads/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLead(updated);
      toast({ title: `Lead marked as ${status.replace(/_/g, " ")}` });
    } else {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const newNote = `[${timestamp}] ${noteText.trim()}`;
    const updatedNotes = lead?.notes
      ? `${lead.notes}\n\n${newNote}`
      : newNote;

    const res = await fetch(`/api/leads/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: lead!.firstName,
        lastName: lead!.lastName || "",
        phone: lead!.phone || "",
        email: lead!.email || "",
        status: lead!.status,
        priority: lead!.priority,
        notes: updatedNotes,
        serviceAddress: lead!.serviceAddress || "",
        serviceRequested: lead!.serviceRequested || "",
        estimatedValue: lead!.estimatedValue,
        source: lead!.source || "",
        nextFollowUpAt: lead!.nextFollowUpAt ?? "",
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setLead(updated);
      setNoteText("");
      toast({ title: "Note added" });
    } else {
      toast({ title: "Failed to add note", variant: "destructive" });
    }
    setAddingNote(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const res = await fetch(`/api/leads/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Lead deleted" });
      router.push("/app/leads");
    } else {
      toast({ title: "Failed to delete lead", variant: "destructive" });
    }
  }

  async function handleConvertToCustomer() {
    try {
      const res = await fetch("/api/customers/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead!.id }),
      });

      if (res.ok) {
        const customer = await res.json();
        toast({ title: "Lead converted to customer!" });
        router.push(`/app/customers/${customer.id}`);
      } else if (res.status === 409) {
        const err = await res.json();
        toast({ title: "This lead was already converted", description: "Redirecting to customer..." });
        if (err.customer) {
          router.push(`/app/customers/${err.customer.id}`);
        }
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to convert lead", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to convert lead", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div>
        <Link href="/app/leads" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  return (
    <div>
      {/* Back link + Actions */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/app/leads"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/app/leads/${lead.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            {lead.source && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Tag className="h-3 w-3" /> Source: {lead.source}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {lead.status !== "CONTACTED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("CONTACTED")}
            >
              <MessageSquare className="h-4 w-4 mr-1" /> Mark Contacted
            </Button>
          )}
          <Link href="/app/follow-ups">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" /> Schedule Follow-Up
            </Button>
          </Link>
          {lead.status !== "WON" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("WON")}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Mark Won
            </Button>
          )}
          {lead.status !== "LOST" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("LOST")}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" /> Mark Lost
            </Button>
          )}
          {lead.status !== "WON" && (
            <Button variant="outline" size="sm" onClick={handleConvertToCustomer} className="text-primary">
              <PlusCircle className="h-4 w-4 mr-1" /> Convert to Customer
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline break-all">
                  {lead.email}
                </a>
              </div>
            )}
            {(lead.serviceAddress || lead.state || lead.zip) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {lead.serviceAddress && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Service Address</p>
                      <p>{lead.serviceAddress}</p>
                    </div>
                  )}
                  {lead.state && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">State</p>
                      <p>{lead.state}</p>
                    </div>
                  )}
                  {lead.zip && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Zip</p>
                      <p>{lead.zip}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!lead.phone && !lead.email && !lead.serviceAddress && !lead.state && !lead.zip && (
              <p className="text-sm text-gray-500">No contact info available.</p>
            )}
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Job Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Service Requested</p>
                <p className="text-sm font-medium">{lead.serviceRequested || "Not specified"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Estimated Value</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  {lead.estimatedValue != null
                    ? lead.estimatedValue.toLocaleString("en-US", { minimumFractionDigits: 2 })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Last Contacted</p>
                <p className="text-sm">
                  {lead.lastContactedAt ? formatDateTime(lead.lastContactedAt) : "Never"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Next Follow-Up</p>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "Not scheduled"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Created</p>
              <p className="text-sm">{formatDateTime(lead.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-gray-900">Notes</h2>
          </CardHeader>
          <CardContent>
            {lead.notes ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700 mb-4 bg-gray-50 rounded-lg p-4">
                {lead.notes}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No notes yet.</p>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
              >
                {addingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
