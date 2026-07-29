"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    // Redirect to the API endpoint which will handle verification and redirect
    window.location.href = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  }, [token]);

  if (!token) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Verification</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          No verification token provided.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Verification</h1>
      <div className="text-gray-600">Verifying your email, please wait...</div>
    </div>
  );
}
