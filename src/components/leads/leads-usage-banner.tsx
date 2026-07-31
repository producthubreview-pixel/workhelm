"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type UsageData = {
  count: number;
  plan: string;
  limit: number;
  subscriptionStatus?: string | null;
} | null;

export function LeadsUsageBanner() {
  const [data, setData] = useState<UsageData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage/leads")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Don't show anything while loading
  if (loading || !data) return null;

  const { count, limit, subscriptionStatus } = data;
  const isLocked = subscriptionStatus === "locked";
  const isCanceled = subscriptionStatus === "canceled";
  const isPaidPlan = data.plan === "STARTER" || data.plan === "PRO";
  const isUnlimited = limit === -1 || limit >= 999999;
  const pct = isUnlimited ? 0 : Math.min((count / limit) * 100, 100);
  const isNearLimit = !isUnlimited && count >= Math.max(limit - 1, Math.floor(limit * 0.9));
  const isAtLimit = !isUnlimited && count >= limit;

  // Determine color scheme
  let barColor = "bg-blue-500";
  let textColor = "text-blue-700";
  let bgColor = "bg-blue-50";
  let borderColor = "border-blue-200";
  let icon = <TrendingUp className="h-5 w-5 text-blue-500" />;

  if (isAtLimit) {
    barColor = "bg-red-500";
    textColor = "text-red-700";
    bgColor = "bg-red-50";
    borderColor = "border-red-300";
    icon = <AlertTriangle className="h-5 w-5 text-red-500" />;
  } else if (isNearLimit) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
    bgColor = "bg-amber-50";
    borderColor = "border-amber-300";
    icon = <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }

  return (
    <>
      {/* Locked or canceled subscription warning */}
      {isPaidPlan && (isLocked || isCanceled) && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-red-700">
                  {isLocked
                    ? "Your subscription has ended and you have too many leads for the Free plan."
                    : "Your subscription is canceled — access ends at period end."}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {isLocked
                    ? `You have ${count} leads (Free plan limit: 5). Reactivate your subscription to continue adding leads.`
                    : "Reactivate in the Stripe Billing Portal to keep full access."}
                </p>
              </div>
            </div>
            <Link href="/app/settings?tab=subscription">
              <Button
                variant="default"
                size="sm"
                className="gap-1 flex-shrink-0 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLocked ? "Reactivate" : "Manage"} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Regular usage bar */}
      <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 mb-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <p className={`font-semibold text-sm ${textColor}`}>
              {isUnlimited
                ? `${count} lead${count === 1 ? "" : "s"}`
                : isAtLimit
                  ? "Limit reached. Upgrade to add more leads."
                  : isNearLimit
                    ? `${limit - count} lead${limit - count === 1 ? "" : "s"} remaining`
                    : `${count} of ${limit} leads used`}
            </p>
          </div>

          {/* Progress bar — only for limited plans */}
          {!isUnlimited && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {count} of {limit} leads used ({Math.round(pct)}%)
              </p>
            </>
          )}

          {isUnlimited && (
            <p className="text-xs text-gray-500 mt-1">Unlimited leads on your plan</p>
          )}
        </div>

        {!isUnlimited && (
          <Link href="/app/settings?tab=subscription">
            <Button
              variant={isAtLimit ? "default" : "outline"}
              size="sm"
              className={`gap-1 flex-shrink-0 ${
                isAtLimit
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : isNearLimit
                    ? "border-amber-400 text-amber-700 hover:bg-amber-100"
                    : ""
              }`}
            >
              Upgrade <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
    </>
  );
}
