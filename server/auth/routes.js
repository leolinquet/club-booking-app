// server/auth/routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { q } from '../db.js';
import { colSet } from '../pg_introspect.js';
import { sendEmail } from '../email/resend.js';

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

  // POST /signup — create user, optionally send email verification
  router.post('/signup', async (req, res) => {
    try {
      const cols = await colSet('users');
      const { username, email, password, name } = req.body || {};

      if (!password) return res.status(400).json({ error: 'Password required' });

      const password_hash = await bcrypt.hash(String(password), 10);

      // Only insert fields that actually exist in the users table
      const values = { password_hash };
      if (cols.has('username') && username) values.username = String(username).trim();
      if (cols.has('email') && email) values.email = String(email).trim().toLowerCase();
      const nameField = pickNameField(cols);
      if (nameField && name) values[nameField] = String(name).trim();

      const keys = Object.keys(values);
      const params = keys.map((_, i) => `$${i + 1}`).join(',');
      const { rows } = await q(
        `INSERT INTO users (${keys.join(',')}) VALUES (${params}) RETURNING id`,
        keys.map(k => values[k])
      );
      const user_id = rows[0].id;

      // If email verification columns exist, send a verify link
      const need = ['email_verify_token', 'email_verify_expires', 'email_verified_at'];
      const canVerify = need.every(k => cols.has(k)) && values.email;
      if (canVerify) {
        const token = crypto.randomBytes(24).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await q(
          `UPDATE users SET email_verify_token=$1, email_verify_expires=$2 WHERE id=$3`,
          [token, expires, user_id]
        );

        const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${token}`;
        try {
          await sendEmail(
            values.email,
            'Verify your email',
            `<p>Welcome! Please verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
          );
        } catch (mailErr) {
          console.error('sendEmail failed:', mailErr?.message || mailErr);
        }
        return res.json({ ok: true, user_id, mode: 'email-verify' });
      }

      return res.json({ ok: true, user_id });
    } catch (e) {
      // Handle Postgres unique constraint errors nicely
      if (e && e.code === '23505') {
        const msg = e.detail || String(e);
        if (msg.includes('(username)')) return res.status(409).json({ error: 'Username already taken' });
        if (msg.includes('(email)')) return res.status(409).json({ error: 'Email already in use' });
      }
      console.error(e);
      return res.status(500).json({ error: 'Signup failed' });
    }
  });

  // GET /verify?token=... — confirm email
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

    const { rows } = await q(
      `SELECT id, email_verify_expires
         FROM users
        WHERE email_verify_token=$1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).send(page('Invalid link', 'Token not found or already used.'));
    }

    const user = rows[0];
    if (user.email_verify_expires && new Date(user.email_verify_expires) < new Date()) {
      return res.status(400).send(page('Expired link', 'Your verification link has expired. Please request a new one.'));
    }

    await q(
      `UPDATE users
          SET email_verified_at = NOW(),
              email_verify_token = NULL,
              email_verify_expires = NULL
        WHERE id=$1`,
      [user.id]
    );

    return res.send(page('Email verified ✅', 'You’re all set. You can close this tab and return to the app.'));
  });

  return router;
}
