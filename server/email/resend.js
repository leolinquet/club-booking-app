// server/email/resend.js
import { Resend } from 'resend';

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is missing');
  return new Resend(key);
}

export async function sendEmail({ to, subject, html }) {
  const resend = getResend(); // created after env is available
  const r = await resend.emails.send({ from: FROM, to, subject, html });
  return !!r?.id;
}
