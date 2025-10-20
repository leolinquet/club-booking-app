// server/auth/routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { q, get, all, run } from '../db.js';
import { colSet, tableInfo } from '../pg_introspect.js';
import { sendEmail, generateVerificationEmail, generateWelcomeEmail } from '../email/resend.js';

// small helper for the minimal HTML screens
function page(title, msg) {
  return `<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<div style="max-width:560px;margin:48px auto;padding:0 16px;font:16px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">
  <h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
  <p style="opacity:.9">${msg}</p>
</div>`;
}

function pickNameField(cols) {
  if (cols.has('display_name')) return 'display_name';
  if (cols.has('name')) return 'name';
  return null;
}

export function buildAuthRouter() {
  const router = express.Router();

  // ---- schema guard (users table must be introspectable)
  router.use(async (_req, res, next) => {
    try {
      const uCols = await colSet('users');
      if (!uCols.size) {
        console.error('[auth] users table not introspectable');
        return res.status(500).json({ error: 'server schema not ready' });
      }
      next();
    } catch (e) {
      console.error('[auth] schema check failed', e);
      return res.status(500).json({ error: 'server schema not ready' });
    }
  });

  // ---- POST /signup --------------------------------------------------------
  router.post('/signup', async (req, res) => {
    try {
      const cols = await colSet('users');
      const info = await tableInfo('users'); // [{name, data_type, is_nullable}]
      const notNull = new Set(info.filter(c => c.is_nullable === 'NO').map(c => c.name));

      // Accept common client payload shapes
      const username = (req.body?.username ?? req.body?.login ?? '').toString().trim();
      const email    = (req.body?.email ?? '').toString().trim().toLowerCase();
      const nameIn   = (req.body?.name ?? '').toString().trim();
      const password = (req.body?.password ?? '').toString();

      if (!password) return res.status(400).json({ error: 'Password required' });

      const password_hash = await bcrypt.hash(password, 10);

      // Build values only for columns that actually exist
      const values = { password_hash };

      if (cols.has('username') && username) values.username = username;
      if (cols.has('email') && email) values.email = email;

      // Handle display name / name with sensible defaults if NOT NULL
      const nameField = pickNameField(cols);
      if (nameField) {
        let dn = nameIn || username || (email ? email.split('@')[0] : '');
        if (!dn && notNull.has(nameField)) {
          dn = `user${Math.floor(Math.random() * 100000)}`;
        }
        if (dn) values[nameField] = dn;
      }

      const keys = Object.keys(values);
      if (!keys.length) {
        return res.status(500).json({ error: 'users table has no compatible columns' });
      }
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const inserted = await get(
        `INSERT INTO users (${keys.join(',')}) VALUES (${placeholders}) RETURNING id`,
        keys.map(k => values[k])
      );
      const user_id = inserted.id;

      // Optional email verification if those columns exist
      const need = ['email_verify_token', 'email_verify_expires', 'email_verified_at'];
      const canVerify = need.every(k => cols.has(k)) && values.email;
      if (canVerify) {
        const token = crypto.randomBytes(24).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await run(
          `UPDATE users SET email_verify_token=$1, email_verify_expires=$2 WHERE id=$3`,
          token, expires, user_id
        );
        const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${token}`;
        try {
          const emailData = await generateVerificationEmail(verifyUrl, values[nameField] || 'there');
          await sendEmail(
            values.email,
            emailData.subject,
            emailData.html,
            emailData.text
          );
        } catch (mailErr) {
          console.error('sendEmail failed:', mailErr?.message || mailErr);
        }
        return res.json({ ok: true, user_id, mode: 'email-verify' });
      }

      return res.json({ ok: true, user_id });
    } catch (e) {
      if (e?.code === '23505') {
        const msg = e.detail || String(e);
        if (msg.includes('(username)')) return res.status(409).json({ error: 'Username already taken' });
        if (msg.includes('(email)')) return res.status(409).json({ error: 'Email already in use' });
      }
      console.error('[auth] signup error:', e);
      return res.status(500).json({ error: 'Signup failed' });
    }
  });

  // ---- POST /login ---------------------------------------------------------
  // POST /login — email OR username + password (with mandatory email verification)
  router.post('/login', async (req, res) => {
    try {
      const { login, password } = req.body || {};
      if (!login || !password) return res.status(400).json({ error: 'Missing credentials' });

      const cols = await colSet('users');

      const parts = [];
      const vals  = [];
      let i = 1;
      if (cols.has('email'))         { parts.push(`email=$${i++}`);         vals.push(String(login).toLowerCase().trim()); }
      if (cols.has('name'))          { parts.push(`name=$${i++}`);          vals.push(String(login).trim()); }
      if (cols.has('display_name'))  { parts.push(`display_name=$${i++}`);  vals.push(String(login).trim()); }
      if (!parts.length) return res.status(500).json({ error: 'server schema not ready' });

      // Get user with email verification status
      const selectFields = ['id', 'password_hash'];
      if (cols.has('email_verified_at')) selectFields.push('email_verified_at');
      if (cols.has('email')) selectFields.push('email');
      const nameField = pickNameField(cols);
      if (nameField) selectFields.push(nameField);
      
      const user = await get(
        `SELECT ${selectFields.join(', ')} FROM users WHERE ${parts.join(' OR ')} LIMIT 1`, 
        ...vals
      );
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(String(password), user.password_hash || '');
      if (!ok)  return res.status(401).json({ error: 'Invalid credentials' });

      // Check email verification status
      if (cols.has('email_verified_at') && !user.email_verified_at) {
        return res.status(403).json({ 
          error: 'Please verify your email address before logging in. Check your email for a verification link.',
          requiresVerification: true 
        });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email 
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie for security
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json({ 
        ok: true, 
        user_id: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user[nameField] || 'User'
        },
        token
      });
    } catch (e) {
      console.error('[auth] login error:', e);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

    // ---- GET /verify?token=... ----------------------------------------------
  router.get('/verify', async (req, res) => {
    const cols = await colSet('users');
    const need = ['email_verify_token', 'email_verify_expires', 'email_verified_at'];
    const missing = need.some(k => !cols.has(k));
    if (missing) {
      return res
        .status(501)
        .send(page('Setup incomplete', 'Email verification is not configured on this server.'));
    }

    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).send(page('Invalid link', 'Missing token.'));

    // Get user with email and name for welcome email
    const selectFields = ['id', 'email_verify_expires', 'email'];
    const nameField = pickNameField(cols);
    if (nameField) selectFields.push(nameField);
    
    const user = await get(
      `SELECT ${selectFields.join(', ')} FROM users WHERE email_verify_token=$1`,
      token
    );
    if (!user) {
      return res.status(400).send(page('Invalid link', 'Token not found or already used.'));
    }
    if (user.email_verify_expires && new Date(user.email_verify_expires) < new Date()) {
      return res.status(400).send(page('Expired link', 'Your verification link has expired. Please request a new one.'));
    }

    // Update user as verified
    await run(
      `UPDATE users
          SET email_verified_at = NOW(),
              email_verify_token = NULL,
              email_verify_expires = NULL
        WHERE id=$1`,
      user.id
    );

    // Send welcome email
    try {
      const userName = user[nameField] || 'there';
      const welcomeEmailData = await generateWelcomeEmail(userName);
      await sendEmail(
        user.email,
        welcomeEmailData.subject,
        welcomeEmailData.html,
        welcomeEmailData.text
      );
    } catch (mailErr) {
      console.error('Welcome email failed:', mailErr?.message || mailErr);
      // Don't fail verification if welcome email fails
    }

    return res.send(page('Email verified ✅', 'Welcome! Your email has been verified successfully. You can now close this tab and log in to the app.'));
  });

  // ---- POST /resend-verification ------------------------------------------
  router.post('/resend-verification', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email address required' });

      const cols = await colSet('users');
      const need = ['email_verify_token', 'email_verify_expires', 'email_verified_at'];
      const missing = need.some(k => !cols.has(k));
      if (missing) {
        return res.status(501).json({ error: 'Email verification is not configured on this server' });
      }

      // Find user by email
      const nameField = pickNameField(cols);
      const selectFields = ['id', 'email', 'email_verified_at'];
      if (nameField) selectFields.push(nameField);
      
      const user = await get(
        `SELECT ${selectFields.join(', ')} FROM users WHERE email=$1`,
        String(email).toLowerCase().trim()
      );
      
      if (!user) {
        // Don't reveal whether email exists for security
        return res.json({ ok: true, message: 'If that email address is registered, we\'ve sent a verification email.' });
      }

      if (user.email_verified_at) {
        return res.status(400).json({ error: 'Email address is already verified' });
      }

      // Generate new verification token
      const token = crypto.randomBytes(24).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      await run(
        `UPDATE users SET email_verify_token=$1, email_verify_expires=$2 WHERE id=$3`,
        token, expires, user.id
      );

      // Send verification email
      const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${token}`;
      try {
        const userName = user[nameField] || 'there';
        const emailData = await generateVerificationEmail(verifyUrl, userName);
        await sendEmail(
          user.email,
          emailData.subject,
          emailData.html,
          emailData.text
        );
      } catch (mailErr) {
        console.error('Resend verification email failed:', mailErr?.message || mailErr);
        return res.status(500).json({ error: 'Failed to send verification email' });
      }

      return res.json({ ok: true, message: 'Verification email sent successfully' });
    } catch (e) {
      console.error('[auth] resend-verification error:', e);
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }
  });

  return router;
}

export default buildAuthRouter;
