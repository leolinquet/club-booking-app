import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('🔍 Email Configuration Check:');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set (using Resend)' : 'Not set (using Ethereal)');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'Default');
  console.log('');
  
  // Check recent users and their verification status
  console.log('📋 Recent users and their email verification status:');
  const users = await pool.query(`
    SELECT id, email, display_name, email_verified_at, email_verify_token, email_verify_expires
    FROM users 
    WHERE email IS NOT NULL 
    ORDER BY id DESC 
    LIMIT 10
  `);
  
  users.rows.forEach(user => {
    const isVerified = user.email_verified_at ? '✅ Verified' : '❌ Not verified';
    const hasToken = user.email_verify_token ? '🔑 Has token' : '🚫 No token';
    const tokenExpired = user.email_verify_expires && new Date(user.email_verify_expires) < new Date() ? '⏰ Expired' : '';
    
    console.log(`- ID: ${user.id}, Email: ${user.email}, ${isVerified}, ${hasToken} ${tokenExpired}`);
  });
  
  await pool.end();
} catch (e) {
  console.error('❌ Error:', e.message);
} finally {
  process.exit(0);
}