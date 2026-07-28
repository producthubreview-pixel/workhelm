"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid email or password"); setLoading(false); }
    else { router.push("/app/today"); router.refresh(); }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to WorkHelm</h1>
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
