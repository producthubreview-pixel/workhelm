"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function EmailVerificationBanner({ email }: { email: string }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          Please verify your email address. Check your inbox for a verification link.
        </p>
        <span className="text-xs text-amber-600 hidden sm:block">{email}</span>
      </div>
    </div>
  );
}
