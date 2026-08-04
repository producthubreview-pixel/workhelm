import { z } from "zod";

export const estimateFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Must be positive").optional().nullable(),
  expiresAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type EstimateFormValues = z.infer<typeof estimateFormSchema>;

export const ESTIMATE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  FOLLOW_UP_DUE: "Follow-Up Due",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const ESTIMATE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  SENT: "bg-blue-100 text-blue-800 border-blue-200",
  FOLLOW_UP_DUE: "bg-orange-100 text-orange-800 border-orange-200",
  ACCEPTED: "bg-green-100 text-green-800 border-green-200",
  DECLINED: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-500 border-gray-200 line-through",
};
