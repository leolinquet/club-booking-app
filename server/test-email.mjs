#!/usr/bin/env node
// Test email sending with Resend
import 'dotenv/config';
import { sendEmail } from './email/resend.js';

const testEmail = process.argv[2] || 'sportsclubnet01@gmail.com';

console.log('Testing email send to:', testEmail);
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set ✓' : 'Missing ✗');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');
console.log('');

try {
  const result = await sendEmail({
    to: testEmail,
    subject: 'Test Email from SportsClubNet',
    html: '<p>This is a test email. If you received this, email verification is working!</p>'
  });
  
  console.log('✅ Email sent successfully!');
  console.log('Result:', result);
} catch (error) {
  console.error('❌ Email send failed:');
  console.error('Error:', error.message);
  console.error('Full error:', error);
  
  if (error.message?.includes('domain')) {
    console.log('\n💡 TIP: You may need to verify your domain in Resend or use a verified sender email.');
  }
}
