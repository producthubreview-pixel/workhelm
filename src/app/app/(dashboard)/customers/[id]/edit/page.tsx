"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";
import { useToast } from "@/components/ui/use-toast";
import type { CustomerFormValues } from "@/lib/customer-schema";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [defaultValues, setDefaultValues] = useState<Partial<CustomerFormValues> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${params.id}`);
        if (res.ok) {
          const customer = await res.json();
          setDefaultValues({
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            serviceAddress: customer.serviceAddress || "",
            notes: customer.notes || "",
          });
        } else {
          toast({ title: "Customer not found", variant: "destructive" });
          router.push("/app/customers");
        }
      } catch {
        toast({ title: "Failed to load customer", variant: "destructive" });
        router.push("/app/customers");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomer();
  }, [params.id]);

  async function handleSubmit(values: CustomerFormValues) {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast({ title: "Customer updated" });
        router.push(`/app/customers/${params.id}`);
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to update customer", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update customer", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!defaultValues) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/app/customers/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border p-6">
          <CustomerForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitLabel="Update Customer"
            isLoading={saving}
          />
        </div>
      </div>
    </div>
  );
}
