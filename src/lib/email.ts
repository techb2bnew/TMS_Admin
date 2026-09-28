import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM = process.env.SMTP_FROM ?? SMTP_USER ?? "TMS Admin";

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      })
    : null;

// Best-effort — a missing config or a delivery failure never blocks the
// driver account creation that triggered this, it just logs so the admin
// can retry (or resend the credentials manually).
export async function sendDriverWelcomeEmail(params: { to: string; fullName: string; password: string }) {
  if (!transporter) {
    console.warn("SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) — skipping driver welcome email to", params.to);
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: params.to,
      subject: "Your TMS Driver app login",
      html: `
        <p>Hi ${params.fullName},</p>
        <p>Your TMS Driver account has been created. Use these credentials to sign in on the TMS Driver app:</p>
        <p>
          <strong>Email:</strong> ${params.to}<br />
          <strong>Password:</strong> ${params.password}
        </p>
      `,
    });
  } catch (err) {
    console.error("Failed to send driver welcome email", err);
  }
}
