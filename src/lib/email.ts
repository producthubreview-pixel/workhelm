import { Resend } from "resend";

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
