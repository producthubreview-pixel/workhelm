"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reset your password</h1>
      {sent ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">If an account exists for {email}, we&apos;ve sent a reset link.</div>
      ) : (
        <form onSubmit={(e)=>{e.preventDefault();setSent(true)}} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition">Send Reset Link</button>
        </form>
      )}
      <p className="mt-4 text-sm text-center"><Link href="/login" className="text-primary hover:underline">Back to sign in</Link></p>
    </div>
  );
}
