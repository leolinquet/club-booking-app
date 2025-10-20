import dotenv from 'dotenv';
import { sendEmail, generateVerificationEmail } from './email/resend.js';

dotenv.config();

async function testDirectEmail() {
  console.log('Testing direct email sending...');
  
  try {
    // Generate a test verification email
    const testToken = 'test-token-123';
    const emailContent = generateVerificationEmail('Test User', testToken);
    
    console.log('Generated email content:', {
      subject: emailContent.subject,
      hasHtml: !!emailContent.html,
      hasText: !!emailContent.text
    });
    
    // Send the email
    console.log('Sending email to leolinquet@gmail.com...');
    const result = await sendEmail({
      to: 'leolinquet@gmail.com',
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
    
    console.log('Email sent successfully!', result);
  } catch (error) {
    console.error('Email sending failed:', error.message);
    console.error('Full error:', error);
  }
}

testDirectEmail();