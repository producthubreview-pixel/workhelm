"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LeadForm } from "@/components/leads/lead-form";
import { useToast } from "@/components/ui/use-toast";
import type { LeadFormValues } from "@/lib/lead-schema";
import { toDatetimeLocal } from "@/lib/date-utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [defaultValues, setDefaultValues] = useState<Partial<LeadFormValues> | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/leads/${params.id}`);
        if (res.ok) {
          const lead = await res.json();
          setDefaultValues({
            firstName: lead.firstName,
            lastName: lead.lastName || "",
            phone: lead.phone || "",
            email: lead.email || "",
            serviceAddress: lead.serviceAddress || "",
            state: lead.state || "",
            zip: lead.zip || "",
            serviceRequested: lead.serviceRequested || "",
            source: lead.source || "",
            status: lead.status,
            priority: lead.priority,
            nextFollowUpAt: lead.nextFollowUpAt
              ? toDatetimeLocal(lead.nextFollowUpAt)
              : "",
            notes: lead.notes || "",
          });
        } else {
          toast({ title: "Lead not found", variant: "destructive" });
          router.push("/app/leads");
        }
      } catch {
        toast({ title: "Failed to load lead", variant: "destructive" });
        router.push("/app/leads");
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [params.id, router, toast]);

  async function handleSubmit(values: LeadFormValues) {
    const res = await fetch(`/api/leads/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      toast({ title: "Lead updated successfully" });
      router.push(`/app/leads/${params.id}`);
    } else {
      const err = await res.json();
      toast({
        title: "Failed to update lead",
        description: err.error || "Please check your inputs",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div>
        <Link href="/app/leads" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Leads
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
        href={`/app/leads/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Lead
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Lead</h1>
      <div className="bg-white rounded-xl border p-6">
        {defaultValues && (
          <LeadForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitLabel="Update Lead"
          />
        )}
      </div>
    </div>
  );
}
