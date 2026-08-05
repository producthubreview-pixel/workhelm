"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EstimateForm, type LeadOption, type CustomerOption } from "@/components/estimates/estimate-form";
import { useToast } from "@/components/ui/use-toast";
import type { EstimateFormValues } from "@/lib/estimate-schema";

export default function NewEstimatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<EstimateFormValues>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [customersRes, leadsRes] = await Promise.all([
          fetch("/api/customers?archived=false"),
          fetch("/api/leads"),
        ]);

        const customerOptions: CustomerOption[] = [];
        if (customersRes.ok) {
          const data = await customersRes.json();
          customerOptions.push(...data.map((c: any) => ({ id: c.id, name: c.name })));
        }
        setCustomers(customerOptions);

        const leadOptions: LeadOption[] = [];
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          leadOptions.push(
            ...data.map((l: any) => ({
              id: l.id,
              firstName: l.firstName,
              lastName: l.lastName ?? null,
              phone: l.phone ?? null,
              email: l.email ?? null,
              serviceRequested: l.serviceRequested ?? null,
            }))
          );
        }
        setLeads(leadOptions);

        const customerId = searchParams.get("customerId");
        const leadId = searchParams.get("leadId");
        const defaults: Partial<EstimateFormValues> = {};
        if (customerId && customerOptions.some((c) => c.id === customerId)) {
          defaults.customerId = customerId;
        }
        if (leadId) {
          const leadRes = await fetch(`/api/leads/${leadId}`);
          if (leadRes.ok) {
            const lead = await leadRes.json();
            // If the lead was already converted, link the estimate to its
            // customer instead (matches the previous customer-only behavior).
            if (lead.customer?.id) {
              defaults.customerId = lead.customer.id;
            } else {
              defaults.leadId = leadId;
            }
            if (lead.serviceRequested) defaults.title = lead.serviceRequested;
          }
        }
        setDefaultValues(defaults);
      } catch (err) {
        console.error("Failed to fetch estimate form data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchParams]);

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
          leads={leads}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Create & Send"
          isLoading={submitting}
        />
      </div>
    </div>
  );
}
