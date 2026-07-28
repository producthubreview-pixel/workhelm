"use client";
import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Set new password</h1>
      {done ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">Password reset successfully. <Link href="/login" className="underline">Sign in</Link></div>
      ) : (
        <form onSubmit={(e)=>{e.preventDefault();setDone(true)}} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition">Reset Password</button>
        </form>
      )}
    </div>
  );
}
