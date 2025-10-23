// server/email/resend.js
import 'dotenv/config'
import nodemailer from 'nodemailer'

export const emailFrom =
  process.env.EMAIL_FROM || 'SportsClubNet <no-reply@dev.local>'

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

export { mailBackend }
