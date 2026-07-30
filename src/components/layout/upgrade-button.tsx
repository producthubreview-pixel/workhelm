"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpCircle } from "lucide-react";

export function UpgradeButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => {
        if (data?.plan === "FREE") setShow(true);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/app/settings"
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:opacity-90 transition"
    >
      <ArrowUpCircle className="h-4 w-4" />
      Upgrade Plan
    </Link>
  );
}
