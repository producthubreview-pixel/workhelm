"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Verification</h1>
      {status === "loading" && (
        <div className="text-gray-600">Verifying your email...</div>
      )}
      {status === "success" && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
          {message}
          <div className="mt-4">
            <Link href="/app/today" className="text-primary hover:underline font-medium">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
