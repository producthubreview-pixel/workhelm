import { z } from "zod";

export const followUpFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueAt: z.string().min(1, "Due date is required"),
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  estimateId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type FollowUpFormValues = z.infer<typeof followUpFormSchema>;

export const FOLLOWUP_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
};

export const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  OVERDUE: "bg-red-100 text-red-800 border-red-200",
};
