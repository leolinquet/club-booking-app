import dotenv from 'dotenv';
import { sendEmail, generateVerificationEmail } from './email/resend.js';

dotenv.config();

async function testEmailRestrictions() {
  console.log('Testing email sending restrictions...');
  
  const testEmails = [
    'leolinquet@gmail.com',  // Your verified email
    'test@example.com',      // Random email
    'another@test.com'       // Another random email
  ];
  
  for (const email of testEmails) {
    try {
      console.log(`\n📧 Testing email to: ${email}`);
      
      const emailContent = generateVerificationEmail('Test User', 'test-token');
      
      const result = await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
      
      console.log(`✅ SUCCESS: Email sent to ${email}`, result);
    } catch (error) {
      console.log(`❌ FAILED: Email to ${email}`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

testEmailRestrictions();