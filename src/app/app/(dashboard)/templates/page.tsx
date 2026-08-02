"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Copy, Check, Edit3, Eye, X, RefreshCw, Loader2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  PLACEHOLDER_VARIABLES,
  SAMPLE_DATA,
  fillTemplate,
} from "@/lib/template-defaults";
import type { MessageTemplateCategory } from "@prisma/client";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: MessageTemplateCategory;
  updatedAt: string;
};

const CATEGORY_ORDER: MessageTemplateCategory[] = [
  "NEW_LEAD",
  "ESTIMATE_SENT",
  "FOLLOW_UP_1",
  "FOLLOW_UP_2",
  "APPOINTMENT",
  "THANK_YOU",
  "REVIEW_REQUEST",
];

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Edit dialog state
  const [editing, setEditing] = useState<Template | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      toast({ title: "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const seedTemplates = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/templates", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        toast({ title: "Templates created", description: "7 default templates ready to use" });
      } else {
        const err = await res.json();
        toast({
          title: "Failed to seed templates",
          description: err.error || "Try again",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to seed templates", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openEdit(t: Template) {
    setEditing(t);
    setEditName(t.name);
    setEditSubject(t.subject);
    setEditBody(t.body);
    setPreviewMode(false);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, subject: editSubject, body: editBody }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        toast({ title: "Template updated" });
        setEditing(null);
      } else {
        toast({ title: "Failed to update template", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function insertVariable(key: string) {
    setEditBody((prev) => prev + " " + key);
  }

  async function copyToClipboard(t: Template) {
    const text = `Subject: ${t.subject}\n\n${t.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(t.id);
      toast({ title: "Template copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }

  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
      templates: templates.filter((t) => t.category === cat),
    }))
    .filter((g) => g.templates.length > 0);

  const previewSubject = editing ? fillTemplate(editSubject, SAMPLE_DATA) : "";
  const previewBody = editing ? fillTemplate(editBody, SAMPLE_DATA) : "";

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Empty / seed state ─────────────────────────────────────────────────

  if (templates.length === 0 && !loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Message Templates</h1>
        <div className="bg-white rounded-xl border p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 mb-2">No message templates yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Get started with 7 pre-built templates for common messages.
          </p>
          <Button onClick={seedTemplates} disabled={seeding}>
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Create Default Templates
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
        <Button variant="outline" size="sm" onClick={fetchTemplates}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Edit your message templates and copy them to clipboard when you need to send a message.
        Variables like {`{{name}}`} are filled in with customer data.
      </p>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{group.icon}</span>
              <h2 className="text-lg font-semibold text-gray-800">{group.label}</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.templates.map((t) => (
                <Card
                  key={t.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => openEdit(t)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{t.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{t.subject}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(t);
                          }}
                          title="Copy to clipboard"
                        >
                          {copiedId === t.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-3">
                      {t.body}
                    </p>
                    <div className="mt-3 pt-2 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Click to edit
                      </span>
                      <button
                        className="px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(t);
                        }}
                      >
                        {copiedId === t.id ? (
                          <>
                            <Check className="h-3 w-3 inline mr-1" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 inline mr-1" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing && CATEGORY_ICONS[editing.category]}
              Edit Template — {editing?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Toggle: Edit / Preview */}
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode ? "outline" : "default"}
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                <Edit3 className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant={previewMode ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
            </div>

            {previewMode ? (
              /* ── Preview mode ────────────────────────────────────── */
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Subject
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {previewSubject}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Body
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {previewBody}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400">
                    Preview uses sample data. Variables are highlighted in the edit view.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Edit mode ────────────────────────────────────────── */
              <>
                <div>
                  <Label htmlFor="edit-name">Template name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Template name..."
                  />
                </div>

                <div>
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input
                    id="edit-subject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Enter subject line..."
                  />
                </div>

                <div>
                  <Label htmlFor="edit-body">Body</Label>
                  <Textarea
                    id="edit-body"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    placeholder="Enter message body..."
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Variable helper */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-2">
                    Available Variables — click to insert
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDER_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        className="inline-flex items-center px-2 py-1 text-xs font-mono font-medium rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
                        onClick={() => insertVariable(v.key)}
                        title={v.label}
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Variables are replaced with real data when you paste into your email/SMS app.
                  </p>
                </div>

                {/* Quick copy current */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    copyToClipboard({ ...editing!, subject: editSubject, body: editBody });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Current to Clipboard
                </Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            {!previewMode && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
