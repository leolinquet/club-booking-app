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

// Generate verification email content
export async function generateVerificationEmail(verifyUrl, displayName) {
  const name = displayName || 'there';
  
  return {
    subject: 'Verify your email - SportsClubNet',
    text: `Hi ${name},\n\nWelcome to SportsClubNet! Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981; margin-bottom: 20px;">Welcome to SportsClubNet!</h1>
        
        <p>Hi ${name},</p>
        
        <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
        
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${verifyUrl}" style="color: #10b981; word-break: break-all;">${verifyUrl}</a>
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #9ca3af; font-size: 12px;">
          SportsClubNet - Your sports club management platform
        </p>
      </div>
    `
  };
}
