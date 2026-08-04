import { MessageTemplateCategory } from "@prisma/client";

export interface DefaultTemplate {
  category: MessageTemplateCategory;
  name: string;
  subject: string;
  body: string;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    category: "NEW_LEAD",
    name: "New Lead Response",
    subject: "Thanks for reaching out, {{customer_name}}!",
    body: "Hi {{customer_name}},\n\nThanks for contacting {{business}} about your {{service}} project. We've received your request and will be in touch shortly with next steps.\n\nIf you need anything in the meantime, just reply to this email.\n\nBest regards,\nThe {{business}} team",
  },
  {
    category: "ESTIMATE_SENT",
    name: "Estimate Sent",
    subject: "Your estimate for {{service}} is ready",
    body: "Hi {{customer_name}},\n\nHere is the estimate for your {{service}} project:\n\nEstimate amount: {{estimate_amount}}\nValid until: {{expires}}\n\nIf you have any questions or would like to move forward, just reply to this email or give us a call. We're happy to walk you through the details.\n\nThanks,\n{{business}}",
  },
  {
    category: "ESTIMATE_UPDATED",
    name: "Estimate Updated",
    subject: "Updated estimate for your {{service}} project",
    body: "Hi {{customer_name}},\n\nWe've updated your estimate for the {{service}} project. Here are the new details:\n\nEstimate amount: {{estimate_amount}}\nValid until: {{expires}}\n\nPlease review the revised estimate and let us know if you have any questions.\n\nThanks,\n{{business}}",
  },
  {
    category: "FOLLOW_UP",
    name: "Follow-Up",
    subject: "Checking in, {{customer_name}}",
    body: "Hi {{customer_name}},\n\nJust checking in — how's everything going with your {{service}}? Let us know if you have any questions or if there's anything we can help with.\n\nYou can reach us at {{phone}}.\n\nBest,\n{{business}}",
  },
  {
    category: "APPOINTMENT",
    name: "Appointment Reminder",
    subject: "Reminder: your appointment on {{appointment_date}}",
    body: "Hi {{customer_name}},\n\nJust a reminder about your upcoming appointment with {{business}}:\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nLocation: {{address}}\n\nIf you need to reschedule or have any questions, just reply to this email or call us at {{phone}}.\n\nThanks,\n{{business}}",
  },
  {
    category: "THANK_YOU",
    name: "Thank You",
    subject: "Thank you for your business!",
    body: "Hi {{customer_name}},\n\nThank you for choosing {{business}} for your {{service}} project. It was a pleasure working with you. If anything comes up after the job, don't hesitate to reach out — we're happy to help.\n\nThanks again,\n{{business}}",
  },
  {
    category: "REVIEW_REQUEST",
    name: "Review Request",
    subject: "How did we do, {{customer_name}}?",
    body: "Hi {{customer_name}},\n\nWe hope you're happy with the {{service}} work we completed. If you have a moment, we'd really appreciate a review — it helps other homeowners in the area find us.\n\nLeave a review here: {{review_link}}\n\nThank you for your support!\n{{business}}",
  },
];

export const PLACEHOLDER_VARIABLES = [
  { key: "{{customer_name}}", label: "Customer name" },
  { key: "{{business}}", label: "Your business name" },
  { key: "{{service}}", label: "Service requested" },
  { key: "{{estimate_amount}}", label: "Estimate amount (e.g. $1,250.00)" },
  { key: "{{expires}}", label: "Estimate expiration date" },
  { key: "{{appointment_date}}", label: "Appointment date" },
  { key: "{{appointment_time}}", label: "Appointment time" },
  { key: "{{address}}", label: "Service address" },
  { key: "{{phone}}", label: "Your phone number" },
  { key: "{{review_link}}", label: "Link to leave a review" },
];

export const CATEGORY_LABELS: Record<MessageTemplateCategory, string> = {
  NEW_LEAD: "New Lead",
  ESTIMATE_SENT: "Estimate Sent",
  ESTIMATE_UPDATED: "Estimate Updated",
  FOLLOW_UP: "Follow-Up",
  APPOINTMENT: "Appointment",
  THANK_YOU: "Thank You",
  REVIEW_REQUEST: "Review Request",
};

export const CATEGORY_ICONS: Record<MessageTemplateCategory, string> = {
  NEW_LEAD: "👋",
  ESTIMATE_SENT: "📊",
  ESTIMATE_UPDATED: "✏️",
  FOLLOW_UP: "📞",
  APPOINTMENT: "📅",
  THANK_YOU: "🙏",
  REVIEW_REQUEST: "⭐",
};

export const SAMPLE_DATA: Record<string, string> = {
  "{{customer_name}}": "John Smith",
  "{{business}}": "WorkHelm Services",
  "{{service}}": "water heater repair",
  "{{estimate_amount}}": "$1,250.00",
  "{{expires}}": "July 15, 2026",
  "{{appointment_date}}": "Monday, July 10, 2026",
  "{{appointment_time}}": "10:00 AM",
  "{{address}}": "123 Main Street, Springfield, IL 62701",
  "{{phone}}": "(555) 123-4567",
  "{{review_link}}": "https://g.page/your-business/review",
};

export function fillTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(key, value);
  }
  return result;
}
