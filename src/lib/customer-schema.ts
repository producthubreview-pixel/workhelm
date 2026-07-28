import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  serviceAddress: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
