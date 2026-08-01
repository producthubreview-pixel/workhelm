import { z } from "zod";

export const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  serviceAddress: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  serviceRequested: z.string().optional(),
  estimatedValue: z.number().positive("Must be positive").optional().nullable(),
  source: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "ESTIMATE_NEEDED", "ESTIMATE_SENT", "FOLLOW_UP", "WON", "LOST"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  nextFollowUpAt: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const STATUS_LABELS: Record<string, string> = {
  NEW: "New Lead",
  CONTACTED: "Contacted",
  ESTIMATE_NEEDED: "Estimate Needed",
  ESTIMATE_SENT: "Estimate Sent",
  FOLLOW_UP: "Follow-Up",
  WON: "Won",
  LOST: "Lost",
};

export const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  CONTACTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  ESTIMATE_NEEDED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ESTIMATE_SENT: "bg-orange-100 text-orange-800 border-orange-200",
  FOLLOW_UP: "bg-purple-100 text-purple-800 border-purple-200",
  WON: "bg-green-100 text-green-800 border-green-200",
  LOST: "bg-red-100 text-red-800 border-red-200",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};
