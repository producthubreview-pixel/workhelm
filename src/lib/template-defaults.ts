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
    subject: "Thanks for reaching out, {{name}}!",
    body: "Hi {{name}}, thanks for contacting {{business}}. We'd love to help with your {{service}} project. I'll give you a call shortly to discuss.",
  },
  {
    category: "ESTIMATE_SENT",
    name: "Estimate Sent",
    subject: "Your estimate for {{service}} is ready",
    body: "Hi {{name}}, I've sent over the estimate for your {{service}} project. It's valid until {{expires}}. Let me know if you have any questions!",
  },
  {
    category: "FOLLOW_UP_1",
    name: "First Follow-Up",
    subject: "Checking in on your estimate",
    body: "Hi {{name}}, just checking in on the estimate I sent for your {{service}} project. Happy to answer any questions!",
  },
  {
    category: "FOLLOW_UP_2",
    name: "Second Follow-Up",
    subject: "Following up one more time",
    body: "Hi {{name}}, I wanted to follow up once more on the {{service}} estimate. If the timing isn't right, no worries — just let me know and I'll check back later.",
  },
  {
    category: "APPOINTMENT",
    name: "Appointment Confirmation",
    subject: "Appointment confirmation",
    body: "Hi {{name}}, confirming our appointment for {{date}} at {{time}}. Our team will arrive at {{address}}. Reply or call if you need to reschedule.",
  },
  {
    category: "THANK_YOU",
    name: "Thank You",
    subject: "Thank you for your business!",
    body: "Hi {{name}}, thank you for choosing {{business}}! We appreciate your business. If you're happy with our work, we'd love a review.",
  },
  {
    category: "REVIEW_REQUEST",
    name: "Review Request",
    subject: "How did we do?",
    body: "Hi {{name}}, thanks again for choosing {{business}} for your {{service}} project. If you have a moment, we'd really appreciate a review. It helps other homeowners find us!",
  },
];

export const PLACEHOLDER_VARIABLES = [
  { key: "{{name}}", label: "Customer name" },
  { key: "{{business}}", label: "Your business name" },
  { key: "{{service}}", label: "Service requested" },
  { key: "{{expires}}", label: "Estimate expiration date" },
  { key: "{{date}}", label: "Appointment date" },
  { key: "{{time}}", label: "Appointment time" },
  { key: "{{address}}", label: "Service address" },
];

export const CATEGORY_LABELS: Record<MessageTemplateCategory, string> = {
  NEW_LEAD: "New Lead",
  ESTIMATE_SENT: "Estimate Sent",
  FOLLOW_UP_1: "Follow-Up #1",
  FOLLOW_UP_2: "Follow-Up #2",
  APPOINTMENT: "Appointment",
  THANK_YOU: "Thank You",
  REVIEW_REQUEST: "Review Request",
};

export const CATEGORY_ICONS: Record<MessageTemplateCategory, string> = {
  NEW_LEAD: "👋",
  ESTIMATE_SENT: "📊",
  FOLLOW_UP_1: "📞",
  FOLLOW_UP_2: "📞",
  APPOINTMENT: "📅",
  THANK_YOU: "🙏",
  REVIEW_REQUEST: "⭐",
};

export const SAMPLE_DATA: Record<string, string> = {
  "{{name}}": "John Smith",
  "{{business}}": "WorkHelm Services",
  "{{service}}": "water heater repair",
  "{{expires}}": "July 15, 2026",
  "{{date}}": "Monday, July 10, 2026",
  "{{time}}": "10:00 AM",
  "{{address}}": "123 Main Street, Springfield, IL 62701",
};

export function fillTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(key, value);
  }
  return result;
}
