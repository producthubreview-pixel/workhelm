"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CustomerFormValues } from "@/lib/customer-schema";

type Lead = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  serviceAddress: string | null;
  notes: string | null;
};

export default function NewCustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLeadId = searchParams.get("leadId");
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(preselectedLeadId || "");
  const [defaultValues, setDefaultValues] = useState<Partial<CustomerFormValues>>({});

  useEffect(() => {
    // Fetch leads for the "Convert from Lead" option
    fetch("/api/leads?status=NEW&status=CONTACTED&status=ESTIMATE_NEEDED&status=ESTIMATE_SENT&status=FOLLOW_UP")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeads(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (preselectedLeadId && leads.length > 0) {
      const lead = leads.find((l) => l.id === preselectedLeadId);
      if (lead) {
        setDefaultValues({
          name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
          phone: lead.phone || "",
          email: lead.email || "",
          serviceAddress: lead.serviceAddress || "",
          notes: lead.notes || "",
        });
      }
    }
  }, [preselectedLeadId, leads]);

  useEffect(() => {
    if (selectedLeadId && selectedLeadId !== preselectedLeadId) {
      const lead = leads.find((l) => l.id === selectedLeadId);
      if (lead) {
        setDefaultValues({
          name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
          phone: lead.phone || "",
          email: lead.email || "",
          serviceAddress: lead.serviceAddress || "",
          notes: lead.notes || "",
        });
      }
    }
  }, [selectedLeadId]);

  async function handleCreateFromScratch(values: CustomerFormValues) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const customer = await res.json();
        toast({ title: "Customer created" });
        router.push(`/app/customers/${customer.id}`);
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to create customer", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to create customer", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConvertFromLead() {
    if (!selectedLeadId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLeadId }),
      });

      if (res.ok) {
        const customer = await res.json();
        toast({ title: "Lead converted to customer" });
        router.push(`/app/customers/${customer.id}`);
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to convert lead", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to convert lead", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const leadName = (lead: Lead) =>
    [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed Lead";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Convert from Lead */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Convert from Lead</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select an existing lead to convert into a customer. All lead details will be copied automatically.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="lead-select">Select a Lead</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger id="lead-select" className="mt-1">
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.length === 0 && (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No unconverted leads available
                    </div>
                  )}
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {leadName(lead)}
                      {lead.phone ? ` • ${lead.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleConvertFromLead}
              disabled={!selectedLeadId || isLoading}
              variant="default"
            >
              {isLoading ? "Converting..." : "Convert Selected Lead to Customer"}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-4 text-gray-500">or create from scratch</span>
          </div>
        </div>

        {/* Create from scratch */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Customer</h2>
          <CustomerForm
            defaultValues={defaultValues}
            onSubmit={handleCreateFromScratch}
            submitLabel="Create Customer"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
