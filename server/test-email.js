import { config } from 'dotenv';

config({ path: '.env' });

async function testEmailSending() {
  console.log('🧪 Testing email sending configuration...\n');
  
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('❌ No valid Resend API key found - will use Ethereal for testing');
      return;
    }
    
    console.log('🔑 Found Resend API key:', process.env.RESEND_API_KEY);
    console.log('📧 Testing with Resend...\n');
    
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Test sending a simple email
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Club Booking <noreply@yourdomain.com>',
      to: 'test@example.com', // This won't actually send since it's a test email
      subject: 'Test Email',
      html: '<p>This is a test email to verify the API key works.</p>',
      text: 'This is a test email to verify the API key works.'
    });
    
    console.log('✅ Resend API key is working!');
    console.log('📧 Test result:', result);
    
  } catch (error) {
    console.log('❌ Resend API key failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Get a real API key from https://resend.com/signup');
    console.log('2. Or remove the RESEND_API_KEY to use Ethereal for testing');
  }
}

testEmailSending().then(() => process.exit(0));