// server/email/resend.js
import 'dotenv/config'
import nodemailer from 'nodemailer'

export const emailFrom =
  process.env.EMAIL_FROM || 'Club Booking <no-reply@dev.local>'

// choose backend: Resend if key is present, otherwise Ethereal
let resendClient = null
let transporter = null
let mailBackend = 'ethereal'

if (process.env.RESEND_API_KEY) {
  const { Resend } = await import('resend')
  resendClient = new Resend(process.env.RESEND_API_KEY)
  mailBackend = 'resend'
} else {
  const acct = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: acct.user, pass: acct.pass },
  })
  mailBackend = 'ethereal'
}

export async function sendEmail({ to, subject, text, html, from }) {
  const _from = from || emailFrom

  if (resendClient) {
    const { data, error } = await resendClient.emails.send({
      from: _from,
      to,
      subject,
      text,
      html,
    })
    if (error) throw error
    return { id: data?.id, backend: 'resend' }
  } else {
    const info = await transporter.sendMail({
      from: _from,
      to,
      subject,
      text,
      html,
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.log('[Ethereal preview]', preview)
    return { id: info.messageId, preview, backend: 'ethereal' }
  }
}

// Email templates
export function generateVerificationEmail(verifyUrl, userDisplayName = 'there') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Club Booking</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: 700;">Club Booking</h1>
          </div>
          
          <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">Welcome to Club Booking!</h2>
          
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">
            Hi ${userDisplayName},
          </p>
          
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">
            Thanks for signing up! To get started with booking courts and managing your club activities, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #2563eb; word-break: break-all;">
            ${verifyUrl}
          </p>
          
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              This verification link will expire in 24 hours. If you didn't create an account with Club Booking, you can safely ignore this email.
            </p>
          </div>
          
          <div style="margin-top: 24px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #9ca3af;">
              Best regards,<br>
              The Club Booking Team
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Club Booking!

Hi ${userDisplayName},

Thanks for signing up! To get started with booking courts and managing your club activities, please verify your email address by visiting this link:

${verifyUrl}

This verification link will expire in 24 hours. If you didn't create an account with Club Booking, you can safely ignore this email.

Best regards,
The Club Booking Team
  `;

  return { 
    subject: 'Verify your email - Club Booking',
    html, 
    text 
  };
}

export function generateWelcomeEmail(userDisplayName = 'there') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Club Booking!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: 700;">Club Booking</h1>
          </div>
          
          <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">🎉 Welcome to the club!</h2>
          
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">
            Hi ${userDisplayName},
          </p>
          
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">
            Your email has been verified and your account is now active! You can now:
          </p>
          
          <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Book courts and playing sessions</li>
            <li style="margin-bottom: 8px;">Join clubs using club codes</li>
            <li style="margin-bottom: 8px;">Connect with other players</li>
            <li style="margin-bottom: 8px;">Participate in tournaments</li>
          </ul>
          
          <div style="margin-top: 32px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #9ca3af;">
              Happy playing!<br>
              The Club Booking Team
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Club Booking!

Hi ${userDisplayName},

Your email has been verified and your account is now active! You can now:

- Book courts and playing sessions
- Join clubs using club codes  
- Connect with other players
- Participate in tournaments

Happy playing!
The Club Booking Team
  `;

  return { 
    subject: 'Welcome to Club Booking!',
    html, 
    text 
  };
}

export { mailBackend }
