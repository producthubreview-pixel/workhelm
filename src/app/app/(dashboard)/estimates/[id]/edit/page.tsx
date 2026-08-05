"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EstimateForm, type LeadOption, type CustomerOption } from "@/components/estimates/estimate-form";
import { useToast } from "@/components/ui/use-toast";
import type { EstimateFormValues } from "@/lib/estimate-schema";

export default function EditEstimatePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [defaultValues, setDefaultValues] = useState<Partial<EstimateFormValues> | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [customersRes, leadsRes, estimateRes] = await Promise.all([
          fetch("/api/customers?archived=false"),
          fetch("/api/leads"),
          fetch(`/api/estimates/${params.id}`),
        ]);

        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomers(data.map((c: any) => ({ id: c.id, name: c.name })));
        }
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(
            data.map((l: any) => ({
              id: l.id,
              firstName: l.firstName,
              lastName: l.lastName ?? null,
              phone: l.phone ?? null,
              email: l.email ?? null,
              serviceRequested: l.serviceRequested ?? null,
            }))
          );
        }

        if (estimateRes.ok) {
          const est = await estimateRes.json();
          // Restore whichever link the estimate has. If both are set (lead was
          // converted after the estimate was created), the customer wins — the
          // estimate's own leadId can be cleared without losing the link, since
          // the customer still points back at the lead.
          setDefaultValues({
            leadId: est.customerId ? "" : (est.leadId || ""),
            customerId: est.customerId || "",
            title: est.title,
            amount: est.amount,
            expiresAt: est.expiresAt
              ? new Date(est.expiresAt).toISOString().split("T")[0]
              : "",
            notes: est.notes || "",
          });
        } else {
          toast({ title: "Estimate not found", variant: "destructive" });
          router.push("/app/estimates");
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        toast({ title: "Failed to load estimate", variant: "destructive" });
        router.push("/app/estimates");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, router, toast]);

  async function handleSubmit(values: EstimateFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/estimates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast({ title: "Estimate updated" });
        router.push(`/app/estimates/${params.id}`);
      } else {
        const err = await res.json();
        toast({
          title: err.error || "Failed to update estimate",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to update estimate", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
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

  if (!defaultValues) return null;

  return (
    <div>
      <Link
        href="/app/estimates"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Estimates
      </Link>

      <div className="bg-white rounded-xl border p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Estimate</h1>
        <EstimateForm
          customers={customers}
          leads={leads}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Update Estimate"
          isLoading={submitting}
        />
      </div>
    </div>
  );
}
