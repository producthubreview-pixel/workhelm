"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpCircle } from "lucide-react";

export function UpgradeButton() {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => {
        setPlan(data?.plan || null);
      })
      .catch(() => {});
  }, []);

  // Hide only for Pro users (already on top tier)
  if (plan === "PRO") return null;
  // Don't flash during loading
  if (plan === null) return null;

  const label = plan === "FREE" ? "Upgrade Plan" : plan === "STARTER" ? "Upgrade to Pro" : "Upgrade Plan";

  return (
    <Link
      href="/app/settings?tab=subscription"
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:opacity-90 transition"
    >
      <ArrowUpCircle className="h-4 w-4" />
      {label}
    </Link>
  );
}
