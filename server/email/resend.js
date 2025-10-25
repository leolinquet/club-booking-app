// server/email/resend.js
import 'dotenv/config'
import nodemailer from 'nodemailer'

export const emailFrom =
  process.env.EMAIL_FROM || 'SportsClubNet <no-reply@dev.local>'

console.log('[EMAIL] Initializing email service...');
console.log('[EMAIL] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('[EMAIL] EMAIL_FROM:', emailFrom);

// choose backend: Resend if key is present, otherwise Ethereal
let resendClient = null
let transporter = null
let mailBackend = 'ethereal'

if (process.env.RESEND_API_KEY) {
  const { Resend } = await import('resend')
  resendClient = new Resend(process.env.RESEND_API_KEY)
  mailBackend = 'resend'
  console.log('[EMAIL] Using Resend backend');
} else {
  console.log('[EMAIL] No RESEND_API_KEY found, using Ethereal for testing');
  const acct = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: acct.user, pass: acct.pass },
  })
  mailBackend = 'ethereal'
}

export async function sendEmail({ to, subject, text, html, from }) {
  const _from = from || emailFrom
  
  console.log('[EMAIL] Attempting to send email:');
  console.log('[EMAIL]   Backend:', mailBackend);
  console.log('[EMAIL]   From:', _from);
  console.log('[EMAIL]   To:', to);
  console.log('[EMAIL]   Subject:', subject);

  if (resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: _from,
        to,
        subject,
        text,
        html,
      })
      if (error) {
        console.error('[EMAIL] Resend error:', error);
        throw error;
      }
      console.log('[EMAIL] ✅ Email sent successfully via Resend, ID:', data?.id);
      return { id: data?.id, backend: 'resend' }
    } catch (err) {
      console.error('[EMAIL] ❌ Failed to send via Resend:', err);
      throw err;
    }
  } else {
    const info = await transporter.sendMail({
      from: _from,
      to,
      subject,
      text,
      html,
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.log('[EMAIL] Ethereal preview:', preview)
    console.log('[EMAIL] Email sent via Ethereal (test mode)');
    return { id: info.messageId, preview, backend: 'ethereal' }
  }
}

export { mailBackend }
