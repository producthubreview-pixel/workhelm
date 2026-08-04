"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  DollarSign,
  Users,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ArrowRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/lead-schema";

// ── Constants ────────────────────────────────────────────────────────────

const PIPELINE_STATUSES = [
  "NEW",
  "CONTACTED",
  "ESTIMATE_NEEDED",
  "ESTIMATE_SENT",
  "FOLLOW_UP",
  "WON",
  "LOST",
] as const;

const COLUMN_DOT_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-cyan-500",
  ESTIMATE_NEEDED: "bg-yellow-500",
  ESTIMATE_SENT: "bg-orange-500",
  FOLLOW_UP: "bg-purple-500",
  WON: "bg-green-500",
  LOST: "bg-red-500",
};

const COLUMN_BG: Record<string, string> = {
  NEW: "bg-blue-50/50",
  CONTACTED: "bg-cyan-50/50",
  ESTIMATE_NEEDED: "bg-yellow-50/50",
  ESTIMATE_SENT: "bg-orange-50/50",
  FOLLOW_UP: "bg-purple-50/50",
  WON: "bg-green-50/50",
  LOST: "bg-red-50/50",
};

const COLUMN_BORDER: Record<string, string> = {
  WON: "border-green-200",
  LOST: "border-red-200",
};

// ── Types ────────────────────────────────────────────────────────────────

type LeadCard = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  serviceRequested: string | null;
  status: string;
  priority: string;
  nextFollowUpAt: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

type PipelineSummary = {
  pipelineValue: number;
  totalLeads: number;
  pipelineCount: number;
  wonThisMonth: number;
  conversionRate: number;
  totalWon: number;
  totalLost: number;
};

type PipelineData = {
  columns: Record<string, LeadCard[]>;
  summary: PipelineSummary;
};

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(val: number | null): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Page Component ───────────────────────────────────────────────────────

export default function PipelinePage() {
  const { toast } = useToast();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpenColumns, setMobileOpenColumns] = useState<
    Record<string, boolean>
  >({});

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline");
      if (!res.ok) throw new Error("Failed to load pipeline");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // ── Optimistic move ──────────────────────────────────────────────────

  const moveCard = useCallback(
    async (leadId: string, fromStatus: string, toStatus: string) => {
      if (fromStatus === toStatus) return;

      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const newColumns = { ...prev.columns };
        const fromCol = [...(newColumns[fromStatus] || [])];
        const cardIndex = fromCol.findIndex((l) => l.id === leadId);
        if (cardIndex === -1) return prev;
        const [card] = fromCol.splice(cardIndex, 1);
        const updatedCard = { ...card, status: toStatus };
        newColumns[fromStatus] = fromCol;
        newColumns[toStatus] = [
          updatedCard,
          ...(newColumns[toStatus] || []),
        ];
        // Recalculate summary
        const activeStatuses = [
          "NEW",
          "CONTACTED",
          "ESTIMATE_NEEDED",
          "ESTIMATE_SENT",
          "FOLLOW_UP",
        ];
        const allLeads = Object.values(newColumns).flat();
        const pipelineLeads = allLeads.filter((l) =>
          activeStatuses.includes(l.status)
        );
        const pipelineValue = 0;
        const wonThisMonth = newColumns["WON"]?.filter(
          (l) =>
            new Date(l.updatedAt) >=
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ).length || 0;
        const totalWon = newColumns["WON"]?.length || 0;
        const totalLost = newColumns["LOST"]?.length || 0;
        const conversionRate =
          totalWon + totalLost > 0
            ? Math.round((totalWon / (totalWon + totalLost)) * 100)
            : 0;
        return {
          columns: newColumns,
          summary: {
            pipelineValue,
            totalLeads: allLeads.length,
            pipelineCount: pipelineLeads.length,
            wonThisMonth,
            conversionRate,
            totalWon,
            totalLost,
          },
        };
      });

      // API call
      try {
        const res = await fetch(`/api/leads/${leadId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: toStatus }),
        });
        if (!res.ok) throw new Error("Failed to update");
        const label = STATUS_LABELS[toStatus] || toStatus;
        toast({
          title: "Lead moved",
          description: `Lead moved to ${label}`,
        });
      } catch {
        // Revert on failure
        toast({
          title: "Error",
          description: "Failed to move lead. Reverting.",
          variant: "destructive",
        });
        fetchPipeline();
      }
    },
    [toast, fetchPipeline]
  );

  // ── Drag end handler ─────────────────────────────────────────────────

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { draggableId, source, destination } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;
      moveCard(draggableId, source.droppableId, destination.droppableId);
    },
    [moveCard]
  );

  // ── Quick move handler ───────────────────────────────────────────────

  const handleQuickMove = useCallback(
    (leadId: string, currentStatus: string, newStatus: string) => {
      moveCard(leadId, currentStatus, newStatus);
      // Close mobile accordion for source column if it becomes empty
      setMobileOpenColumns((prev) => ({ ...prev, [currentStatus]: true }));
    },
    [moveCard]
  );

  // ── Toggle mobile column ─────────────────────────────────────────────

  const toggleMobileColumn = (status: string) => {
    setMobileOpenColumns((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // ── Loading / Error states ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPipeline}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { columns, summary } = data;
  const activeLeads = summary.pipelineCount;
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 1024 : false;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <button
          onClick={fetchPipeline}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ── Summary Bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <DollarSign className="h-4 w-4" />
            Pipeline Value
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(summary.pipelineValue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Users className="h-4 w-4" />
            Active Leads
          </div>
          <p className="text-xl font-bold text-gray-900">{activeLeads}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Target className="h-4 w-4" />
            Won This Month
          </div>
          <p className="text-xl font-bold text-green-600">
            {summary.wonThisMonth}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            Conversion Rate
          </div>
          <p className="text-xl font-bold text-gray-900">
            {summary.conversionRate}%
          </p>
        </div>
      </div>

      {/* ── Kanban Board ──────────────────────────────────────────────── */}

      {/* Desktop: horizontal scrollable kanban */}
      <div className="hidden lg:block">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
            {PIPELINE_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={columns[status] || []}
                onQuickMove={handleQuickMove}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Mobile: accordion stack */}
      <div className="lg:hidden space-y-3">
        {PIPELINE_STATUSES.map((status) => {
          const statusLeads = columns[status] || [];
          const isOpen = mobileOpenColumns[status] ?? false;

          return (
            <div
              key={status}
              className={`bg-white rounded-xl border overflow-hidden ${
                COLUMN_BORDER[status] || ""
              }`}
            >
              <button
                onClick={() => toggleMobileColumn(status)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${COLUMN_DOT_COLORS[status]}`}
                  />
                  <span className="font-semibold text-sm text-gray-900">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2 max-h-[50vh] overflow-y-auto">
                  {statusLeads.length === 0 ? (
                    <EmptyState status={status} />
                  ) : (
                    statusLeads.map((lead) => (
                      <MobileLeadCard
                        key={lead.id}
                        lead={lead}
                        onQuickMove={(newStatus) =>
                          handleQuickMove(lead.id, lead.status, newStatus)
                        }
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Kanban Column (Desktop) ────────────────────────────────────────────

function KanbanColumn({
  status,
  leads,
  onQuickMove,
}: {
  status: string;
  leads: LeadCard[];
  onQuickMove: (leadId: string, currentStatus: string, newStatus: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${COLUMN_DOT_COLORS[status]}`}
          />
          <span className="font-semibold text-sm text-gray-900">
            {STATUS_LABELS[status]}
          </span>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column body */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-xl border p-2 space-y-2 min-h-[200px] transition-colors ${
              COLUMN_BG[status] || "bg-gray-50/50"
            } ${COLUMN_BORDER[status] || ""} ${
              snapshot.isDraggingOver ? "ring-2 ring-primary/20 bg-primary/5" : ""
            }`}
          >
            {leads.length === 0 ? (
              <EmptyState status={status} />
            ) : (
              leads.map((lead, index) => (
                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing ${
                        snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30 rotate-1" : ""
                      }`}
                    >
                      <LeadCardContent lead={lead} onQuickMove={(newStatus) => onQuickMove(lead.id, lead.status, newStatus)} />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// ── Lead Card Content ─────────────────────────────────────────────────

function LeadCardContent({
  lead,
  onQuickMove,
}: {
  lead: LeadCard;
  onQuickMove: (newStatus: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const name = `${lead.firstName} ${lead.lastName || ""}`.trim();

  return (
    <div className="relative">
      {/* Click target for navigation */}
      <Link href={`/app/leads/${lead.id}`} className="block">
        <p className="font-medium text-sm text-gray-900 truncate">{name || "Unnamed Lead"}</p>
        {lead.serviceRequested && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {lead.serviceRequested}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {lead.priority === "HIGH" && (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> High
            </span>
          )}
        </div>
        {lead.nextFollowUpAt && (
          <p
            className={`text-xs mt-1.5 ${
              isOverdue(lead.nextFollowUpAt)
                ? "text-red-600 font-medium"
                : "text-gray-400"
            }`}
          >
            {isOverdue(lead.nextFollowUpAt)
              ? "⚠ Overdue: "
              : "Follow-up: "}
            {formatDate(lead.nextFollowUpAt)}
          </p>
        )}
      </Link>

      {/* Quick move dropdown */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute right-0 top-7 z-20 w-44 bg-white border rounded-lg shadow-lg py-1">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                Move to...
              </p>
              {PIPELINE_STATUSES.filter((s) => s !== lead.status).map(
                (status) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      onQuickMove(status);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${COLUMN_DOT_COLORS[status]}`}
                    />
                    {STATUS_LABELS[status]}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mobile Lead Card ──────────────────────────────────────────────────

function MobileLeadCard({
  lead,
  onQuickMove,
}: {
  lead: LeadCard;
  onQuickMove: (newStatus: string) => void;
}) {
  const name = `${lead.firstName} ${lead.lastName || ""}`.trim();

  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <Link href={`/app/leads/${lead.id}`} className="block">
        <p className="font-medium text-sm text-gray-900">{name || "Unnamed Lead"}</p>
        {lead.serviceRequested && (
          <p className="text-xs text-gray-500 mt-0.5">
            {lead.serviceRequested}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {lead.priority === "HIGH" && (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> High
            </span>
          )}
        </div>
        {lead.nextFollowUpAt && (
          <p
            className={`text-xs mt-1.5 ${
              isOverdue(lead.nextFollowUpAt)
                ? "text-red-600 font-medium"
                : "text-gray-400"
            }`}
          >
            {isOverdue(lead.nextFollowUpAt) ? "⚠ Overdue: " : "Follow-up: "}
            {formatDate(lead.nextFollowUpAt)}
          </p>
        )}
      </Link>

      <div className="mt-2 pt-2 border-t flex flex-wrap gap-1.5">
        {PIPELINE_STATUSES.filter((s) => s !== lead.status).map((status) => (
          <button
            key={status}
            onClick={() => onQuickMove(status)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100"
          >
            <span
              className={`w-2 h-2 rounded-full ${COLUMN_DOT_COLORS[status]}`}
            />
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────

function EmptyState({ status }: { status: string }) {
  const isWon = status === "WON";
  const isLost = status === "LOST";

  let message = "No leads yet";
  let subMessage = "New leads will appear here";
  if (isWon) {
    message = "No won leads yet";
    subMessage = "Keep following up — you'll get there!";
  } else if (isLost) {
    message = "No lost leads";
    subMessage = "That's a good thing! Keep it up.";
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <p className="text-sm font-medium text-gray-400">{message}</p>
      <p className="text-xs text-gray-300 mt-1">{subMessage}</p>
    </div>
  );
}
