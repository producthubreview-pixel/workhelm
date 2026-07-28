"use client";

import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/leads/lead-form";
import { useToast } from "@/components/ui/use-toast";
import type { LeadFormValues } from "@/lib/lead-schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(values: LeadFormValues) {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      const lead = await res.json();
      toast({ title: "Lead created successfully" });
      router.push(`/app/leads/${lead.id}`);
    } else {
      const err = await res.json();
      toast({
        title: "Failed to create lead",
        description: err.error || "Please check your inputs",
        variant: "destructive",
      });
    }
  }

  return (
    <div>
      <Link
        href="/app/leads"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Lead</h1>
      <div className="bg-white rounded-xl border p-6">
        <LeadForm onSubmit={handleSubmit} submitLabel="Create Lead" />
      </div>
    </div>
  );
}
