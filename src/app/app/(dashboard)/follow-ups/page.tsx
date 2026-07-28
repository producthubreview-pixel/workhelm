"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  CheckCircle,
  Calendar,
  Clock,
  Edit,
  Trash2,
  User,
  Building2,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import { FOLLOWUP_STATUS_COLORS } from "@/lib/followup-schema";
import { addDays, startOfDay, endOfDay } from "date-fns";

// Types

type RelatedEntity = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  title?: string;
};

type FollowUp = {
  id: string;
  title: string;
  dueAt: string;
  status: "OPEN" | "COMPLETED";
  completedAt: string | null;
  notes: string | null;
  leadId: string | null;
  customerId: string | null;
  estimateId: string | null;
  lead: RelatedEntity | null;
  customer: RelatedEntity | null;
  estimate: RelatedEntity | null;
};

type Option = { id: string; label: string };

const TABS = [
  { key: "today", label: "Due Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [saving, setSaving] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<FollowUp | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("09:00");
  const [formLeadId, setFormLeadId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formEstimateId, setFormEstimateId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const [leads, setLeads] = useState<Option[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [estimates, setEstimates] = useState<Option[]>([]);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/followups");
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data);
      }
    } catch {
      toast({ title: "Failed to load follow-ups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchEntityOptions = useCallback(async () => {
    try {
      const [leadsRes, customersRes, estimatesRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/customers"),
        fetch("/api/estimates"),
      ]);
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(
          data.map((l: any) => ({
            id: l.id,
            label: (l.firstName + " " + (l.lastName || "")).trim(),
          }))
        );
      }
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.map((c: any) => ({ id: c.id, label: c.name })));
      }
      if (estimatesRes.ok) {
        const data = await estimatesRes.json();
        setEstimates(data.map((e: any) => ({ id: e.id, label: e.title })));
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
    fetchEntityOptions();
  }, [fetchFollowUps, fetchEntityOptions]);

  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  function getFiltered(tab: TabKey): FollowUp[] {
    let filtered = followUps;
    switch (tab) {
      case "today":
        filtered = followUps.filter(
          (f) => f.status === "OPEN" && new Date(f.dueAt) >= today && new Date(f.dueAt) <= todayEnd
        );
        break;
      case "upcoming":
        filtered = followUps.filter((f) => f.status === "OPEN" && new Date(f.dueAt) > todayEnd);
        break;
      case "overdue":
        filtered = followUps.filter((f) => f.status === "OPEN" && new Date(f.dueAt) < today);
        break;
      case "completed":
        filtered = followUps.filter((f) => f.status === "COMPLETED");
        break;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.notes && f.notes.toLowerCase().includes(q)) ||
          (f.lead && (f.lead.firstName + " " + (f.lead.lastName || "")).toLowerCase().includes(q)) ||
          (f.customer && (f.customer.name || "").toLowerCase().includes(q)) ||
          (f.estimate && (f.estimate.title || "").toLowerCase().includes(q))
      );
    }
    return filtered;
  }

  const counts: Record<TabKey, number> = {
    today: getFiltered("today").length,
    upcoming: getFiltered("upcoming").length,
    overdue: getFiltered("overdue").length,
    completed: getFiltered("completed").length,
  };

  async function handleComplete(id: string) {
    try {
      const res = await fetch("/api/followups/" + id + "/complete", { method: "PATCH" });
      if (res.ok) {
        toast({ title: "Follow-up completed" });
        fetchFollowUps();
      } else {
        toast({ title: "Failed to complete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to complete", variant: "destructive" });
    }
  }

  function openReschedule(fu: FollowUp) {
    setRescheduling(fu);
    const d = new Date(fu.dueAt);
    setRescheduleDate(d.toISOString().slice(0, 10));
    setRescheduleTime(d.toTimeString().slice(0, 5));
    setRescheduleOpen(true);
  }

  async function handleReschedule() {
    if (!rescheduling || !rescheduleDate) return;
    try {
      const dueAt = new Date(rescheduleDate + "T" + rescheduleTime + ":00").toISOString();
      const res = await fetch("/api/followups/" + rescheduling.id + "/reschedule", {
        method: "PATCH",
        body: JSON.stringify({ dueAt }),
      });
      if (res.ok) {
        toast({ title: "Follow-up rescheduled" });
        setRescheduleOpen(false);
        setRescheduling(null);
        fetchFollowUps();
      } else {
        toast({ title: "Failed to reschedule", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to reschedule", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this follow-up?")) return;
    try {
      const res = await fetch("/api/followups/" + id, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Follow-up deleted" });
        fetchFollowUps();
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  function openCreate() {
    setEditing(null);
    setFormTitle("");
    setFormDueDate(new Date().toISOString().slice(0, 10));
    setFormDueTime("09:00");
    setFormLeadId("");
    setFormCustomerId("");
    setFormEstimateId("");
    setFormNotes("");
    setFormOpen(true);
  }

  function openEdit(fu: FollowUp) {
    setEditing(fu);
    setFormTitle(fu.title);
    const d = new Date(fu.dueAt);
    setFormDueDate(d.toISOString().slice(0, 10));
    setFormDueTime(d.toTimeString().slice(0, 5));
    setFormLeadId(fu.leadId || "");
    setFormCustomerId(fu.customerId || "");
    setFormEstimateId(fu.estimateId || "");
    setFormNotes(fu.notes || "");
    setFormOpen(true);
  }

  async function handleSave() {
    if (!formTitle.trim() || !formDueDate) {
      toast({ title: "Title and due date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const dueAt = new Date(formDueDate + "T" + formDueTime + ":00").toISOString();
    const body = {
      title: formTitle.trim(),
      dueAt,
      leadId: formLeadId || null,
      customerId: formCustomerId || null,
      estimateId: formEstimateId || null,
      notes: formNotes.trim() || null,
    };
    try {
      const url = editing ? "/api/followups/" + editing.id : "/api/followups";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, body: JSON.stringify(body) });
      if (res.ok) {
        toast({ title: editing ? "Follow-up updated" : "Follow-up created" });
        setFormOpen(false);
        setEditing(null);
        fetchFollowUps();
      } else {
        const err = await res.json();
        toast({
          title: "Failed to save",
          description: err.error || "Please check your input",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function getRelatedLabel(fu: FollowUp): { label: string; href: string; icon: React.ReactNode } | null {
    if (fu.lead) {
      return {
        label: (fu.lead.firstName + " " + (fu.lead.lastName || "")).trim(),
        href: "/app/leads/" + fu.lead.id,
        icon: <User className="h-3.5 w-3.5" />,
      };
    }
    if (fu.customer) {
      return {
        label: fu.customer.name || "Unknown",
        href: "/app/customers/" + fu.customer.id,
        icon: <Building2 className="h-3.5 w-3.5" />,
      };
    }
    if (fu.estimate) {
      return {
        label: fu.estimate.title || "Untitled",
        href: "/app/estimates/" + fu.estimate.id,
        icon: <FileText className="h-3.5 w-3.5" />,
      };
    }
    return null;
  }

  function getCardStyle(fu: FollowUp, tab: TabKey): string {
    if (fu.status === "COMPLETED") return "border-l-4 border-l-green-400";
    if (tab === "overdue") return "border-l-4 border-l-red-400 bg-red-50/30";
    if (tab === "today") return "border-l-4 border-l-amber-400";
    return "";
  }

  function isOverdue(fu: FollowUp): boolean {
    return fu.status === "OPEN" && new Date(fu.dueAt) < today;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Follow-Up
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="relative">
                {t.label}
                {counts[t.key] > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 text-xs">
                    {counts[t.key]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Search follow-ups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : getFiltered(t.key).length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">
                  {t.key === "today"
                    ? "No follow-ups due today"
                    : t.key === "upcoming"
                    ? "No upcoming follow-ups"
                    : t.key === "overdue"
                    ? "No overdue follow-ups \u2014 great job!"
                    : "No completed follow-ups"}
                </p>
                <p className="text-sm mt-1">
                  {t.key !== "completed" && (
                    <button onClick={openCreate} className="text-primary hover:underline">
                      Schedule a new follow-up
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFiltered(t.key).map((fu) => {
                  const related = getRelatedLabel(fu);
                  return (
                    <Card key={fu.id} className={getCardStyle(fu, t.key) + " hover:shadow-sm transition-shadow"}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{fu.title}</h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {isOverdue(fu) ? (
                                      <span className="text-red-600 font-medium">
                                        Overdue \u2014 {formatDateTime(fu.dueAt)}
                                      </span>
                                    ) : (
                                      formatDateTime(fu.dueAt)
                                    )}
                                  </span>
                                  {related && (
                                    <Link href={related.href} className="flex items-center gap-1 text-primary hover:underline">
                                      {related.icon}
                                      {related.label}
                                    </Link>
                                  )}
                                </div>
                              </div>
                              <Badge className={FOLLOWUP_STATUS_COLORS[isOverdue(fu) ? "OVERDUE" : fu.status] || "bg-gray-100"}>
                                {isOverdue(fu) ? "Overdue" : fu.status}
                              </Badge>
                            </div>
                            {fu.notes && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{fu.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {fu.status === "OPEN" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleComplete(fu.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">Complete</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => openReschedule(fu)}
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">Reschedule</span>
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => openEdit(fu)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(fu.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Follow-Up" : "Schedule Follow-Up"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fu-title">Title *</Label>
              <Input
                id="fu-title"
                placeholder="e.g. Call back about estimate"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fu-date">Due Date *</Label>
                <Input id="fu-date" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fu-time">Time</Label>
                <Input id="fu-time" type="time" value={formDueTime} onChange={(e) => setFormDueTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Related To</Label>
              <div className="grid grid-cols-1 gap-2 mt-1">
                <Select
                  value={formLeadId}
                  onValueChange={(v) => {
                    setFormLeadId(v);
                    setFormCustomerId("");
                    setFormEstimateId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to a lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formCustomerId}
                  onValueChange={(v) => {
                    setFormCustomerId(v);
                    setFormLeadId("");
                    setFormEstimateId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to a customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formEstimateId}
                  onValueChange={(v) => {
                    setFormEstimateId(v);
                    setFormLeadId("");
                    setFormCustomerId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to an estimate (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {estimates.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="fu-notes">Notes</Label>
              <Textarea
                id="fu-notes"
                placeholder="Add notes..."
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {rescheduling && (
              <p className="text-sm text-gray-600">
                Rescheduling: <strong>{rescheduling.title}</strong>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rs-date">Date</Label>
                <Input id="rs-date" type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="rs-time">Time</Label>
                <Input id="rs-time" type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRescheduleDate(addDays(new Date(), 1).toISOString().slice(0, 10))}
              >
                Tomorrow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRescheduleDate(addDays(new Date(), 7).toISOString().slice(0, 10))}
              >
                Next Week
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRescheduleOpen(false); setRescheduling(null); }}>
              Cancel
            </Button>
            <Button onClick={handleReschedule}>
              <Calendar className="h-4 w-4 mr-2" /> Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
