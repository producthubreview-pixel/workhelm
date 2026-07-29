"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const verified = searchParams.get("verified");
    const errorParam = searchParams.get("error");
    const registered = searchParams.get("registered");

    if (verified === "true") {
      setSuccessMsg("Email verified successfully! You can now sign in.");
    } else if (errorParam === "invalid_token") {
      setError("Invalid or expired verification link. Please sign up again or request a new verification.");
    } else if (errorParam === "expired_token") {
      setError("Verification link has expired. Please sign up again.");
    } else if (errorParam === "missing_token") {
      setError("No verification token provided.");
    } else if (errorParam === "verify_failed") {
      setError("Email verification failed. Please try again.");
    } else if (registered === "true") {
      setSuccessMsg("Account created! Please check your email for a verification link.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError(result.error === "CredentialsSignin"
        ? "Invalid email or password"
        : result.error);
      setLoading(false);
    } else {
      router.push("/app/today");
      router.refresh();
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to WorkHelm</h1>
      {successMsg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4">{successMsg}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="you@company.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="mt-4 text-sm text-center space-y-2">
        <p><Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link></p>
        <p className="text-gray-500">Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
