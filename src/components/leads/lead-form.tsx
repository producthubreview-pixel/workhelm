"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, type LeadFormValues } from "@/lib/lead-schema";
import {
  Form,
  FormControl,
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

const statusOptions = [
  { value: "NEW", label: "New Lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "ESTIMATE_NEEDED", label: "Estimate Needed" },
  { value: "ESTIMATE_SENT", label: "Estimate Sent" },
  { value: "FOLLOW_UP", label: "Follow-Up" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

interface LeadFormProps {
  defaultValues?: Partial<LeadFormValues>;
  onSubmit: (values: LeadFormValues) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function LeadForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Lead",
  isLoading = false,
}: LeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      serviceAddress: "",
      city: "",
      state: "",
      zip: "",
      serviceRequested: "",
      estimatedValue: null,
      source: "",
      status: "NEW",
      priority: "MEDIUM",
      nextFollowUpAt: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          // datetime-local submits local time without a timezone (e.g. "2026-08-02T15:21").
          // Convert to a proper UTC ISO string before sending so the server stores the
          // correct instant and display code can convert it back to local time.
          if (values.nextFollowUpAt) {
            values.nextFollowUpAt = new Date(values.nextFollowUpAt).toISOString();
          }
          await onSubmit(values);
        })}
        className="space-y-6"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="serviceAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main St"
                  autoComplete="street-address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  placeholder="Los Angeles"
                  autoComplete="address-level2"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CA"
                    maxLength={2}
                    autoComplete="address-level1"
                    className="uppercase"
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Zip</FormLabel>
                <FormControl>
                  <Input
                    placeholder="90210"
                    maxLength={10}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    {...field}
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
            name="serviceRequested"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Requested</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Water heater repair, Patio install" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Google, Referral, Yelp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="estimatedValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. Job Value ($)</FormLabel>
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
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nextFollowUpAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Follow-Up</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className="max-w-[240px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any relevant notes about this lead..."
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
