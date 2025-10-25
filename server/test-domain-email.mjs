import 'dotenv/config';
import { sendEmail } from './email/resend.js';

const testEmail = async () => {
  try {
    console.log('🚀 Testing domain verification...');
    console.log('Sending from:', process.env.EMAIL_FROM);
    console.log('Sending to: sportsclubnet01@gmail.com');
    
    await sendEmail({
      to: 'sportsclubnet01@gmail.com',
      subject: '🎉 Domain Verification Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Domain Verified Successfully!</h1>
          
          <p>Congratulations! Your domain <strong>sportsclubnet.com</strong> has been verified with Resend.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What this means:</h3>
            <ul>
              <li>✉️ You can now send emails from <code>@sportsclubnet.com</code></li>
              <li>🌐 Emails will be sent from <code>no-reply@sportsclubnet.com</code></li>
              <li>👥 Users can sign up with any email address</li>
              <li>📧 Email verification will work in production</li>
            </ul>
          </div>
          
          <p>This is a test email to confirm that:</p>
          <ol>
            <li>DNS records are properly configured</li>
            <li>Domain verification is complete</li>
            <li>Emails can be sent to any recipient</li>
          </ol>
          
          <p style="margin-top: 30px;">
            <strong>Next steps:</strong><br>
            Deploy your changes to production and your email verification system will be fully operational!
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Sent from SportsClubNet<br>
            Powered by Resend
          </p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('\n📧 Check sportsclubnet01@gmail.com inbox');
    console.log('💡 If you don\'t see it, check your spam folder');
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
};

testEmail();
