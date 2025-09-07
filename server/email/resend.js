// server/email/resend.js
import { Resend } from 'resend';

const FROM = process.env.FROM_EMAIL || 'Club Booking <onboarding@resend.dev>';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is missing');
  return new Resend(key);
}

export async function sendEmail({ to, subject, html }) {
  try {
    const resend = getResend();
    const resp = await resend.emails.send({ from: FROM, to, subject, html });

    const id = resp?.id || resp?.data?.id || null;
    const apiError = resp?.error || null;
    const ok = Boolean(id) && !apiError;

    if (!ok) {
      console.error('[mail] failed', { to, subject, from: FROM, resp });
      return { ok: false, error: apiError?.message || 'Unknown send failure', resp, to, from: FROM, subject };
    }

    console.log('[mail] sent', { id, to, subject, from: FROM });
    return { ok: true, id, to, from: FROM, subject };
  } catch (e) {
    console.error('[mail] exception', { to, subject, from: FROM, error: String(e) });
    return { ok: false, error: String(e), to, from: FROM, subject };
  }
}
