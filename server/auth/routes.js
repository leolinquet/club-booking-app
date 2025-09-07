// server/auth/routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../email/resend.js';
import { validatePassword } from './passwordPolicy.js';

function getUserColumns(db) {
    try { return new Set(db.prepare('PRAGMA table_info(users)').all().map(c => c.name)); }
    catch { return new Set(); }
    }
    function has(cols, c) { return cols.has(c); }
    function pickNameField(cols) { return has(cols, 'display_name') ? 'display_name' : has(cols, 'name') ? 'name' : null; }

    /** Build an INSERT for only the columns that actually exist */
    function insertUser(db, cols, values) {
    const keys = Object.keys(values).filter(k => values[k] !== undefined && has(cols, k));
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO users (${keys.join(',')}) VALUES (${placeholders})`;
    const args = keys.map(k => values[k]);
    const info = db.prepare(sql).run(...args);
    return info.lastInsertRowid;
    }

    export function buildAuthRouter(db) {
    const router = express.Router();
    const cols = getUserColumns(db);
    const nameField = pickNameField(cols);

// ---------- SIGNUP (email verify in prod; test bypass allowed) ----------
    router.post('/signup', async (req, res) => {
        try {
            // Normalize inputs up front
            const body = req.body || {};
            const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
            const username = typeof body.username === 'string' ? body.username.trim() : '';
            const password = typeof body.password === 'string' ? body.password : '';
            const providedName = (body.display_name || body.name || username || '').trim() || null;

            const cols = new Set(db.prepare('PRAGMA table_info(users)').all().map(c => c.name));
            const has = (c) => cols.has(c);
            const nameField = has('display_name') ? 'display_name' : (has('name') ? 'name' : null);

            const testBypass = req.get('x-test-signup-secret') === process.env.TEST_SIGNUP_SECRET;

            // If schema has username, require it in real signups
            if (has('username') && !username) {
            return res.status(400).json({ error: 'Username required' });
            }

            // --- DEV/TEST PATH (no email required) ---
            if (testBypass) {
            const pwOk = validatePassword(password || 'Aa123');
            if (!pwOk.ok) return res.status(400).json({ error: pwOk.error });

            const hash = has('password_hash') ? await bcrypt.hash(password || 'Aa123', 10) : undefined;

            const values = {
                username: has('username') ? (username || (providedName ? providedName.replace(/\s+/g, '').toLowerCase() : null)) : undefined,
                [nameField || '']: nameField ? (providedName || null) : undefined,
                is_test: has('is_test') ? 1 : undefined,
                email_verified_at: has('email_verified_at') ? new Date().toISOString() : undefined,
                password_hash: hash,
                role: has('role') ? 'user' : undefined,
            };
            const keys = Object.keys(values).filter(k => values[k] !== undefined);
            const placeholders = keys.map(() => '?').join(',');
            const sql = `INSERT INTO users (${keys.join(',')}) VALUES (${placeholders})`;
            const info = db.prepare(sql).run(...keys.map(k => values[k]));
            return res.json({ ok: true, user_id: info.lastInsertRowid, mode: 'test' });
            }

            // --- REAL PATH: email + password required ---
            if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
            }
            if (!(has('email') && has('password_hash') && has('email_verify_token') && has('email_verify_expires'))) {
            return res.status(501).json({ error: 'Email verification not configured on server schema' });
            }

            const pw = validatePassword(password);
            if (!pw.ok) return res.status(400).json({ error: pw.error });

            const hash = await bcrypt.hash(password, 10);

            // ✅ Generate token/expires FIRST
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            // Insert user (unverified)
            const values = {
            email,
            password_hash: hash,
            email_verify_token: token,
            email_verify_expires: expires,
            username: has('username') ? username : undefined,
            [nameField || '']: nameField ? (providedName || username || null) : undefined,
            role: has('role') ? 'user' : undefined, // default role
            };
            const keys = Object.keys(values).filter(k => values[k] !== undefined);
            const placeholders = keys.map(() => '?').join(',');
            const sql = `INSERT INTO users (${keys.join(',')}) VALUES (${placeholders})`;
            const info = db.prepare(sql).run(...keys.map(k => values[k]));

            // Build verify link AFTER token exists
            const base = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
            const verifyUrl = `${base}/auth/verify?token=${token}`;

            // Send email
            const { ok, error } = await sendEmail({
            to: email,
            subject: 'Verify your Club Booking email',
            html: `
                <div style="font-family:system-ui">
                <h2>Confirm your email</h2>
                <p>Hi ${providedName || username || ''}, click to verify your account:</p>
                <p><a href="${verifyUrl}">Verify Email</a></p>
                <p>If the button doesn’t work, open this link:<br>${verifyUrl}</p>
                </div>
            `,
            });
            if (!ok) {
            return res.status(500).json({ error: 'Failed to send verification email', detail: error });
            }

            return res.json({ ok: true, user_id: info.lastInsertRowid, mode: 'email-verify' });
        } catch (e) {
            const msg = String(e);
            if (msg.includes('UNIQUE') && msg.includes('username')) return res.status(409).json({ error: 'Username already taken' });
            if (msg.includes('UNIQUE') && msg.includes('email')) return res.status(409).json({ error: 'Email already in use' });
            return res.status(500).json({ error: msg });
        }
});

    // ---------- VERIFY ----------
    router.get('/verify', (req, res) => {
        const cols = new Set(db.prepare('PRAGMA table_info(users)').all().map(c=>c.name));
        const need = ['email_verify_token','email_verify_expires','email_verified_at'];
        const missing = need.some(n => !cols.has(n));
        const html = (title, msg) =>
            `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"/>
            <div style="font-family:system-ui;max-width:520px;margin:12vh auto;padding:24px;text-align:center">
            <h1 style="margin:0 0 12px">${title}</h1>
            <p style="opacity:.8">${msg}</p>
            </div>`;

        if (missing) {
            return res.status(501).send(html('Setup incomplete',
            'Email verification is not configured on this server.'));
        }

        const { token } = req.query;
        if (!token) return res.status(400).send(html('Missing token', 'Try the link again.'));

        const row = db.prepare(
            `SELECT id, email_verify_expires FROM users WHERE email_verify_token = ?`
        ).get(token);

        if (!row) return res.status(400).send(html('Invalid link', 'This verification link is not valid.'));

        if (new Date(row.email_verify_expires) < new Date()) {
            return res.status(400).send(html('Link expired', 'Request a new verification email and try again.'));
        }

        db.prepare(`
            UPDATE users
            SET email_verified_at = ?, email_verify_token = NULL, email_verify_expires = NULL
            WHERE id = ?
        `).run(new Date().toISOString(), row.id);

        return res.status(200).send(html('✅ Email verified', 'You can close this tab and return to the app.'));
        });

    // ---------- RESEND VERIFY ----------
    router.post('/resend-verification', async (req, res) => {
        if (!(has(cols, 'email') && has(cols, 'email_verify_token') && has(cols, 'email_verify_expires'))) {
        return res.status(501).json({ error: 'Email verification not configured on server schema' });
        }
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ error: 'Email required' });

        const idFieldForName = nameField || (has(cols, 'username') ? 'username' : null);
        const sel = `SELECT id${idFieldForName ? `, ${idFieldForName} AS pname` : ''} FROM users WHERE email = ? AND (email_verified_at IS NULL OR email_verified_at = '')`;
        const user = db.prepare(sel).get(email.toLowerCase());
        if (!user) return res.status(404).json({ error: 'No unverified account with that email' });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        db.prepare(`UPDATE users SET email_verify_token=?, email_verify_expires=? WHERE id=?`).run(token, expires, user.id);

        const verifyUrl = `${process.env.APP_BASE_URL}/auth/verify?token=${token}`;
        await sendEmail({
        to: email,
        subject: 'Verify your Club Booking email',
        html: `<p>Hi ${user.pname || ''}, verify here: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
        });

        res.json({ ok: true });
    });

    // ---------- LOGIN (email OR username OR legacy name/display_name) ----------
    router.post('/login', async (req, res) => {
        try {
        const { email, username, login, name, password } = req.body || {};
        const idf = (login || email || username || name || '').trim();
        if (!idf) return res.status(400).json({ error: 'Email or username required' });

        let u = null;
        if (!u && idf.includes('@') && has(cols, 'email')) {
            u = db.prepare(`SELECT * FROM users WHERE email = ?`).get(idf.toLowerCase());
        }
        if (!u && has(cols, 'username')) {
            u = db.prepare(`SELECT * FROM users WHERE username = ?`).get(idf);
        }
        if (!u && has(cols, 'name')) {
            u = db.prepare(`SELECT * FROM users WHERE name = ?`).get(idf);
        }
        if (!u && has(cols, 'display_name')) {
            u = db.prepare(`SELECT * FROM users WHERE display_name = ?`).get(idf);
        }
        if (!u) return res.status(401).json({ error: 'Invalid credentials' });

        // 👇 force verification if the account has an email but no verified_at
        const requiresVerification =
            has(cols,'email') && has(cols,'email_verified_at') && u.email && !u.email_verified_at;
            const testBypass =
            req.get('x-test-signup-secret') === process.env.TEST_SIGNUP_SECRET ||
            (has(cols,'is_test') && u.is_test === 1);

            if (requiresVerification && !testBypass) {
            return res.status(403).json({ error: 'Email not verified' });
            }

        const allowLegacy = process.env.ALLOW_LEGACY_USERNAME_LOGIN === '1' && process.env.NODE_ENV !== 'production';

        if (has(cols, 'password_hash') && u.password_hash) {
            if (!password) return res.status(400).json({ error: 'Password required' });
            const ok = await bcrypt.compare(password, u.password_hash);
            if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        } else {
            if (!(allowLegacy || testBypass)) {
            return res.status(403).json({ error: 'Account requires password. Please reset or contact admin.' });
            }
        }

        if (has(cols, 'email') && u.email && has(cols, 'email_verified_at') && !u.email_verified_at && !testBypass) {
            return res.status(403).json({ error: 'Email not verified' });
        }

        res.json({
            ok: true,
            user: {
            id: u.id,
            username: (has(cols, 'username') ? u.username : null) || (has(cols, 'name') ? u.name : null) || (has(cols, 'display_name') ? u.display_name : null),
            email: has(cols, 'email') ? (u.email || null) : null,
            role: has(cols, 'role') ? (u.role || 'user') : 'user',
            },
        });
        } catch (e) {
        res.status(500).json({ error: String(e) });
        }
    });

    // ---------- LEGACY /register (dev/test convenience) ----------
    router.post('/register', async (req, res) => {
        try {
        const devAllowed = (process.env.NODE_ENV !== 'production') || (req.get('x-test-signup-secret') === process.env.TEST_SIGNUP_SECRET);
        if (!devAllowed) return res.status(410).json({ error: 'Use /auth/signup (email verification required).' });

        const { name, display_name, username, role, password } = req.body || {};
        const providedName = display_name || name || username || null;
        const pwOk = validatePassword(password || 'Aa123');
        if (!pwOk.ok) return res.status(400).json({ error: pwOk.error });

        const hash = has(cols, 'password_hash') ? await bcrypt.hash(password || 'Aa123', 10) : undefined;

        const values = {
            username: has(cols, 'username') ? (username || (providedName ? providedName.replace(/\s+/g, '').toLowerCase() : null)) : undefined,
            [nameField || '']: nameField ? (providedName || null) : undefined,
            role: has(cols, 'role') ? (role || 'user') : undefined,
            is_test: has(cols, 'is_test') ? 1 : undefined,
            email_verified_at: has(cols, 'email_verified_at') ? new Date().toISOString() : undefined,
            password_hash: hash,
        };

        const userId = insertUser(db, cols, values);
        res.json({ ok: true, user: { id: userId, username: values.username || providedName || null, role: values.role || 'user' } });
        } catch (e) {
        res.status(500).json({ error: String(e) });
        }
    });

    return router;
    }
