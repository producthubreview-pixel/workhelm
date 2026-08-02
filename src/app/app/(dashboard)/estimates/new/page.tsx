"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EstimateForm } from "@/components/estimates/estimate-form";
import { useToast } from "@/components/ui/use-toast";
import type { EstimateFormValues } from "@/lib/estimate-schema";

export default function NewEstimatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers?archived=false");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setLoadingCustomers(false);
      }
    }
    fetchCustomers();
  }, []);

  async function handleSubmit(values: EstimateFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Estimate created" });
        router.push(`/app/estimates/${data.id}`);
      } else {
        const err = await res.json();
        toast({
          title: err.error || "Failed to create estimate",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to create estimate", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCustomers) {
    return (
      <div>
        <Link
          href="/app/estimates"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Estimates
        </Link>
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/app/estimates"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Estimates
      </Link>

      <div className="bg-white rounded-xl border p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Create & Send Estimate</h1>
        <EstimateForm
          customers={customers}
          onSubmit={handleSubmit}
          submitLabel="Create & Send"
          isLoading={submitting}
        />
      </div>
    </div>
  );
}
