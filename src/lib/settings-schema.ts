import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().min(1, "Business name is required"),
  phone: z.string().min(1, "Phone is required"),
  logoUrl: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  businessCategory: z.string().optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const BUSINESS_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
  "Landscaping",
  "General Contracting",
  "Painting",
  "Cleaning",
  "Pest Control",
  "Tree Service",
  "Paving / Asphalt",
  "Concrete",
  "Handyman",
  "Moving",
  "Junk Removal",
  "Pressure Washing",
  "Other",
];

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
];
