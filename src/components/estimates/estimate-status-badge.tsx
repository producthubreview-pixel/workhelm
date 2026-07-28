"use client";

import { ESTIMATE_STATUS_LABELS, ESTIMATE_STATUS_COLORS } from "@/lib/estimate-schema";

export function EstimateStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        ESTIMATE_STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {ESTIMATE_STATUS_LABELS[status] || status}
    </span>
  );
}
