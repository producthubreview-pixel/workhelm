"use client";
import { useState } from "react";
import Link from "next/link";

const categories = ["Plumbing","HVAC","Electrical","Roofing","Landscaping","General Contracting","Painting","Cleaning","Pest Control","Other"];
const timezones = ["America/Chicago","America/New_York","America/Denver","America/Los_Angeles","America/Phoenix"];

export default function SignupPage() {
  const [form, setForm] = useState({ name:"",businessName:"",email:"",phone:"",password:"",category:"",timezone:"America/Chicago" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { throw new Error(data.error || "Signup failed"); }
      setRegistered(true);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (registered) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Check your email</h1>
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm mb-4">
          We&apos;ve sent a verification link to <strong>{form.email}</strong>. Please check your inbox and click the link to verify your account.
        </div>
        <p className="text-sm text-gray-500">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <Link href="/login" className="text-primary hover:underline">go to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create your WorkHelm account</h1>
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input type="text" value={form.businessName} onChange={(e)=>setForm({...form,businessName:e.target.value})} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required minLength={8} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
            <select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select...</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select value={form.timezone} onChange={(e)=>setForm({...form,timezone:e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              {timezones.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
          {loading?"Creating account...":"Start Free Trial"}
        </button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-500">Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
    </div>
  );
}
