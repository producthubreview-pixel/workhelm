import { Resend } from "resend";
import { MessageTemplateCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATES, fillTemplate } from "@/lib/template-defaults";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromAddress = "hello@getworkhelm.com";

interface SendEmailParams {
  to: string;
  subject: string;
  /** Plain text is converted to simple paragraphs for email clients. */
  body?: string;
  /** Use html for system emails such as verification links. */
  html?: string;
}

export async function sendEmail({ to, subject, body, html }: SendEmailParams): Promise<boolean> {
  const emailHtml = html || (body || "").split(/\n\s*\n/).map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`).join("");
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL DISABLED] Would send to ${to}: ${subject}`);
    console.log(emailHtml);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend send error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    console.error("Resend API key prefix:", process.env.RESEND_API_KEY?.substring(0, 8));
    return false;
  }
}

/**
 * Sends a message-template email (NEW_LEAD, ESTIMATE_SENT, ...) to a lead or
 * customer using the owner's saved template for that category.
 *
 * - Looks up the owner's template for `category`; if none is saved yet it falls
 *   back to the built-in default template.
 * - Returns false (and sends nothing) when the saved template is disabled.
 * - Never throws: callers can fire-and-forget and rely on the boolean result.
 */
export async function sendTemplateEmail(
  category: MessageTemplateCategory,
  recipientEmail: string,
  recipientName: string,
  variables: Record<string, string>,
  userId?: string
): Promise<boolean> {
  try {
    let template: { subject: string; body: string; enabled?: boolean } | null = null;
    if (userId) {
      const saved = await db.messageTemplate.findFirst({
        where: { userId, category },
        select: { subject: true, body: true, enabled: true },
      });
      if (saved) {
        if (!saved.enabled) {
          console.log(`[EMAIL SKIPPED] Template "${category}" is disabled — no email to ${recipientEmail}`);
          return false;
        }
        template = saved;
      }
    }
    if (!template) {
      template = DEFAULT_TEMPLATES.find((item) => item.category === category) ?? null;
    }
    if (!template) {
      console.error(`No template found for category ${category}`);
      return false;
    }

    // The recipient name is always available to templates, even if the caller
    // forgot to pass it in variables.
    const data = { "{{customer_name}}": recipientName, ...variables };

    return await sendEmail({
      to: recipientEmail,
      subject: fillTemplate(template.subject, data),
      body: fillTemplate(template.body, data),
    });
  } catch (error) {
    console.error(`Failed to send ${category} template email to ${recipientEmail}:`, error);
    return false;
  }
}

export function verificationEmailHtml(verifyUrl: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;font-family:sans-serif">
      <h1 style="color:#111">Verify your email</h1>
      <p style="color:#333">Welcome to WorkHelm! Please verify your email to get started.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Verify Email</a>
      <p style="color:#666;font-size:14px;margin-top:24px">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
}

export function resetPasswordEmailHtml(resetUrl: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;font-family:sans-serif">
      <h1 style="color:#111">Reset your password</h1>
      <p style="color:#333">Click the button below to reset your password for your WorkHelm account.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Reset Password</a>
      <p style="color:#666;font-size:14px;margin-top:24px">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}
