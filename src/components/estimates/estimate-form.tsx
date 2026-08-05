"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { estimateFormSchema, type EstimateFormValues } from "@/lib/estimate-schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LeadOption {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  serviceRequested: string | null;
}

export interface CustomerOption {
  id: string;
  name: string;
}

// Radix Select forbids "" as an item value, so "none" is the clear option.
const NONE = "none";

interface EstimateFormProps {
  customers: CustomerOption[];
  leads: LeadOption[];
  defaultValues?: Partial<EstimateFormValues>;
  onSubmit: (values: EstimateFormValues) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

function leadDisplayName(lead: LeadOption): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || lead.firstName;
}

export function EstimateForm({
  customers,
  leads,
  defaultValues,
  onSubmit,
  submitLabel = "Save Estimate",
  isLoading = false,
}: EstimateFormProps) {
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      leadId: "",
      customerId: "",
      title: "",
      amount: null,
      expiresAt: "",
      notes: "",
      ...defaultValues,
    },
  });

  const selectedLeadId = form.watch("leadId");
  const selectedCustomerId = form.watch("customerId");
  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // When a lead is selected, pre-fill the title from the lead's requested
  // service (kept in sync with the ?leadId= flow on the new-estimate page) and
  // show the lead's name so the contractor sees who the estimate is for.
  function handleLeadChange(value: string) {
    const leadId = value === NONE ? "" : value;
    form.setValue("leadId", leadId, { shouldValidate: true });
    // Selecting a lead clears any customer selection — one primary link only.
    form.setValue("customerId", "", { shouldValidate: true });
    if (leadId) {
      const lead = leads.find((l) => l.id === leadId);
      const title = form.getValues("title");
      if (lead?.serviceRequested && !title) {
        form.setValue("title", lead.serviceRequested);
      }
    }
  }

  function handleCustomerChange(value: string) {
    const customerId = value === NONE ? "" : value;
    form.setValue("customerId", customerId, { shouldValidate: true });
    // Selecting a customer clears any lead selection — one primary link only.
    form.setValue("leadId", "", { shouldValidate: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead</FormLabel>
                <Select
                  onValueChange={handleLeadChange}
                  value={field.value || NONE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead (optional)..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {leadDisplayName(l)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLead && (
                  <FormDescription>
                    Estimating for lead: {leadDisplayName(selectedLead)}
                    {selectedLead.phone ? ` · ${selectedLead.phone}` : ""}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  onValueChange={handleCustomerChange}
                  value={field.value || NONE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer (optional)..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Pick a lead <em>or</em> a customer — choosing one clears the other.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Water Heater Replacement" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : parseFloat(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope of Work</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Scope of work, materials, etc."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
