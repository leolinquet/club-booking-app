// server/auth/routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { q, get, all, run } from '../db.js';
import { colSet, tableInfo } from '../pg_introspect.js';
import { sendEmail } from '../email/resend.js';

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
          await sendEmail({
            to: values.email,
            subject: 'Verify your email',
            html: `<p>Welcome! Please verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
          });
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
  // POST /login — email OR username + password
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

      const user = await get(`SELECT id, password_hash FROM users WHERE ${parts.join(' OR ')} LIMIT 1`, ...vals);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(String(password), user.password_hash || '');
      if (!ok)  return res.status(401).json({ error: 'Invalid credentials' });

      return res.json({ ok: true, user_id: user.id });
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

    const user = await get(
      `SELECT id, email_verify_expires FROM users WHERE email_verify_token=$1`,
      token
    );
    if (!user) {
      return res.status(400).send(page('Invalid link', 'Token not found or already used.'));
    }
    if (user.email_verify_expires && new Date(user.email_verify_expires) < new Date()) {
      return res.status(400).send(page('Expired link', 'Your verification link has expired. Please request a new one.'));
    }

    await run(
      `UPDATE users
          SET email_verified_at = NOW(),
              email_verify_token = NULL,
              email_verify_expires = NULL
        WHERE id=$1`,
      user.id
    );

    return res.send(page('Email verified ✅', 'You’re all set. You can close this tab and return to the app.'));
  });

  return router;
}

export default buildAuthRouter;
