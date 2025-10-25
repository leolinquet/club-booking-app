#!/usr/bin/env node
// Resend verification email for a user
import 'dotenv/config';
import { Pool } from 'pg';
import crypto from 'crypto';
import { sendEmail } from './email/resend.js';

const email = process.argv[2] || 'leolinquet@gmail.com';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://leolopez-linquet@localhost:5432/clubbooking_local'
});

try {
  // Get user
  const userResult = await pool.query(
    `SELECT id, email, display_name 
     FROM users 
     WHERE email = $1 OR display_name = $1 OR username = $1`,
    [email]
  );
  
  if (userResult.rows.length === 0) {
    console.log('❌ User not found:', email);
    process.exit(1);
  }
  
  const user = userResult.rows[0];
  console.log('Found user:', user);
  
  // Generate new verification token
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  // Update database with new token
  await pool.query(
    `UPDATE users 
     SET email_verify_token = $1, email_verify_expires = $2 
     WHERE id = $3`,
    [token, expires, user.id]
  );
  
  console.log('✅ Generated verification token');
  
  // Send verification email
  const verifyUrl = `http://localhost:5051/auth/verify?token=${token}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Verify your email - SportsClubNet',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SportsClubNet!</h2>
        <p>Hi ${user.display_name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `
  });
  
  console.log('✅ Verification email sent to:', user.email);
  console.log('');
  console.log('📧 Check your email inbox!');
  console.log('');
  console.log('Verification link (valid for 24 hours):');
  console.log(verifyUrl);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
} finally {
  await pool.end();
}
