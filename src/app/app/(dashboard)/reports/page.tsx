"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Trophy, XCircle, TrendingUp,
  FileText, CheckCircle, ThumbsDown, DollarSign,
  Calendar, AlertTriangle, Percent,
  Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// ── Types ────────────────────────────────────────────────────────────────

type ReportsData = {
  totalLeads: number;
  leadsWon: number;
  leadsLost: number;
  leadsWonPct: number;
  leadsLostPct: number;
  conversionRate: number;
  estimatesSent: number;
  estimatesAccepted: number;
  estimatesDeclined: number;
  estimatesAcceptedPct: number;
  estimatesDeclinedPct: number;
  pipelineValue: number;
  followUpsCompleted: number;
  overdueFollowUps: number;
  totalFollowUps: number;
  followUpCompletionRate: number;
};

type DateRange = "thisWeek" | "thisMonth" | "lastMonth" | "custom";

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const now = new Date();

  switch (range) {
    case "thisWeek": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0],
      };
    }
    case "thisMonth": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: first.toISOString().split("T")[0],
        endDate: last.toISOString().split("T")[0],
      };
    }
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: first.toISOString().split("T")[0],
        endDate: last.toISOString().split("T")[0],
      };
    }
    default:
      return { startDate: "", endDate: "" };
  }
}

// ── Progress bar component ───────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: "green" | "red" | "blue" | "amber";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colorClasses = {
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${colorClasses[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function RatioBar({
  positive,
  negative,
  positiveLabel,
  negativeLabel,
}: {
  positive: number;
  negative: number;
  positiveLabel?: string;
  negativeLabel?: string;
}) {
  const total = positive + negative;
  const posPct = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((negative / total) * 100) : 0;

  return (
    <div className="mt-3">
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
        {total > 0 && (
          <>
            <div
              className="bg-green-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${posPct}%` }}
            >
              {posPct >= 15 && (
                <span className="text-[10px] text-white font-medium">{posPct}%</span>
              )}
            </div>
            <div
              className="bg-red-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${negPct}%` }}
            >
              {negPct >= 15 && (
                <span className="text-[10px] text-white font-medium">{negPct}%</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          <span className="text-gray-600">
            {positiveLabel || "Won"} {positive}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span className="text-gray-600">
            {negativeLabel || "Lost"} {negative}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  progressBar,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  progressBar?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className="border shadow-none h-full">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2.5 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {progressBar}
        {children}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string, endDate: string;

      if (dateRange === "custom") {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        startDate = customStart;
        endDate = customEnd;
      } else {
        const range = getDateRange(dateRange);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.details || json.error || "Failed to fetch");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd, toast]);

  useEffect(() => {
    if (dateRange === "custom" && (!customStart || !customEnd)) {
      return;
    }
    fetchData();
  }, [dateRange, customStart, customEnd, fetchData]);

  const rangeButtons: { label: string; value: DateRange }[] = [
    { label: "This Week", value: "thisWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "Custom", value: "custom" },
  ];

  // ── Loading ──────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
        <div className="text-center py-20">
          <p className="text-gray-500">Unable to load reports.</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* ─── Date Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {rangeButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={dateRange === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* ─── Custom Date Range ───────────────────────────────────────── */}
      {dateRange === "custom" && (
        <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div>
            <Label htmlFor="custom-start" className="text-xs mb-1 block">
              Start Date
            </Label>
            <Input
              id="custom-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="custom-end" className="text-xs mb-1 block">
              End Date
            </Label>
            <Input
              id="custom-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            size="sm"
            onClick={fetchData}
            disabled={!customStart || !customEnd}
          >
            Apply
          </Button>
        </div>
      )}

      {/* ─── 1. Summary Cards Row ────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Lead Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Total Leads"
            value={data.totalLeads.toString()}
            icon={Users}
            colorClass="text-blue-600 bg-blue-50"
          />
          <StatCard
            label="Leads Won"
            value={data.leadsWon.toString()}
            sub={`${data.leadsWonPct}% of all leads`}
            icon={Trophy}
            colorClass="text-green-600 bg-green-50"
            progressBar={
              <ProgressBar value={data.leadsWon} max={data.totalLeads} color="green" />
            }
          />
          <StatCard
            label="Leads Lost"
            value={data.leadsLost.toString()}
            sub={`${data.leadsLostPct}% of all leads`}
            icon={XCircle}
            colorClass="text-red-600 bg-red-50"
            progressBar={
              <ProgressBar value={data.leadsLost} max={data.totalLeads} color="red" />
            }
          />
          <StatCard
            label="Conversion Rate"
            value={`${data.conversionRate}%`}
            sub="Won / (Won + Lost)"
            icon={TrendingUp}
            colorClass={
              data.conversionRate >= 50
                ? "text-green-600 bg-green-50"
                : data.conversionRate >= 30
                ? "text-amber-600 bg-amber-50"
                : "text-red-600 bg-red-50"
            }
          >
            <RatioBar
              positive={data.leadsWon}
              negative={data.leadsLost}
              positiveLabel="Won"
              negativeLabel="Lost"
            />
          </StatCard>
        </div>
      </div>

      {/* ─── 2. Estimate Stats Row ───────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Estimates</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Estimates Sent"
            value={data.estimatesSent.toString()}
            icon={FileText}
            colorClass="text-purple-600 bg-purple-50"
          />
          <StatCard
            label="Estimates Accepted"
            value={data.estimatesAccepted.toString()}
            sub={`${data.estimatesAcceptedPct}% of sent`}
            icon={CheckCircle}
            colorClass="text-green-600 bg-green-50"
            progressBar={
              <ProgressBar
                value={data.estimatesAccepted}
                max={data.estimatesSent}
                color="green"
              />
            }
          />
          <StatCard
            label="Estimates Declined"
            value={data.estimatesDeclined.toString()}
            sub={`${data.estimatesDeclinedPct}% of sent`}
            icon={ThumbsDown}
            colorClass="text-red-600 bg-red-50"
            progressBar={
              <ProgressBar
                value={data.estimatesDeclined}
                max={data.estimatesSent}
                color="red"
              />
            }
          />
          <StatCard
            label="Pipeline Value"
            value={formatCurrency(data.pipelineValue)}
            sub="Active leads (not won/lost)"
            icon={DollarSign}
            colorClass="text-emerald-600 bg-emerald-50"
          />
        </div>
      </div>

      {/* ─── 3. Follow-Up Stats Row ──────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Follow-Ups</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard
            label="Follow-Ups Completed"
            value={data.followUpsCompleted.toString()}
            icon={Calendar}
            colorClass="text-green-600 bg-green-50"
          />
          <StatCard
            label="Overdue Follow-Ups"
            value={data.overdueFollowUps.toString()}
            icon={AlertTriangle}
            colorClass={
              data.overdueFollowUps > 0
                ? "text-red-600 bg-red-50"
                : "text-gray-600 bg-gray-50"
            }
          >
            {data.overdueFollowUps > 0 && (
              <p className="text-xs text-red-500 mt-1 font-medium">
                Action needed!
              </p>
            )}
          </StatCard>
          <StatCard
            label="Completion Rate"
            value={`${data.followUpCompletionRate}%`}
            sub={`${data.followUpsCompleted} of ${data.totalFollowUps} total`}
            icon={Percent}
            colorClass={
              data.followUpCompletionRate >= 70
                ? "text-green-600 bg-green-50"
                : data.followUpCompletionRate >= 40
                ? "text-amber-600 bg-amber-50"
                : "text-red-600 bg-red-50"
            }
            progressBar={
              <ProgressBar
                value={data.followUpsCompleted}
                max={data.totalFollowUps}
                color={
                  data.followUpCompletionRate >= 70
                    ? "green"
                    : data.followUpCompletionRate >= 40
                    ? "amber"
                    : "red"
                }
              />
            }
          />
        </div>
      </div>

      {/* ─── 4. Win/Loss Visual ──────────────────────────────────────── */}
      {data.leadsWon + data.leadsLost > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Win/Loss Breakdown
          </h2>
          <Card className="border shadow-none">
            <CardContent className="p-4 md:p-6">
              <RatioBar
                positive={data.leadsWon}
                negative={data.leadsLost}
                positiveLabel="Won"
                negativeLabel="Lost"
              />
              <div className="mt-4 flex items-center justify-center gap-8 text-sm">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {data.leadsWon}
                  </p>
                  <p className="text-gray-500">Won</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400">
                    {data.leadsWon + data.leadsLost}
                  </p>
                  <p className="text-gray-500">Total Decided</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {data.leadsLost}
                  </p>
                  <p className="text-gray-500">Lost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
