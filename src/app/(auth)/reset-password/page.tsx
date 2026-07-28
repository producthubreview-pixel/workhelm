"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setNoToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (noToken) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Invalid Reset Link</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          This password reset link is invalid or missing. Please request a new one.
        </div>
        <p className="mt-4 text-sm text-center">
          <Link href="/forgot-password" className="text-primary hover:underline">Request new reset link</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Set new password</h1>
      {done ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
          Password reset successfully.{" "}
          <Link href="/login" className="underline font-medium">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Min. 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}
