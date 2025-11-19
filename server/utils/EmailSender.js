import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set.");
}
const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = "SafVault <onboarding@resend.dev>";

export async function sendEmail(
  to,
  subject,
  htmlContent,

) {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Email Error:", error);
      throw new Error(`Failed to send email to ${to}.`);
    }

    console.log(`Email successfully sent to ${to}. Resend ID: ${data.id}`);
    return data;
  } catch (err) {
    console.error("Email utility failed:", err);
    throw err;
  }
}
