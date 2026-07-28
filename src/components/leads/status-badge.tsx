import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/lead-schema";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-700"
      }`}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
