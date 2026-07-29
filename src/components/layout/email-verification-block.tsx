"use client";
import { useState } from "react";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";

export function EmailVerificationBlock({ email }: { email: string }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch (e) {
      // silently fail
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center max-w-md w-full">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Mail className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify your email</h1>
        <p className="text-gray-600 mb-2">
          We sent a verification link to{" "}
          <strong className="text-gray-900">{email}</strong>.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Please check your inbox and click the link to access WorkHelm.
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {resending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : resent ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Sent!
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Resend verification email
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Didn't receive it? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
}
