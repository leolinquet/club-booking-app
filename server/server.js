// server/server.js  (ESM version)
// Run with: npm run dev  (dev script should be: node -r dotenv/config server.js)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import db, { pool, run, q, one, all, get, prepare, tableExists } from './db.js';
import { tableInfo, addColumnsIfMissing } from './pg_compat.js';
import { sendEmail } from './email/resend.js';
import { DateTime } from 'luxon';

// Prisma setup
import { prisma, logDbConnection } from './prisma.js';
import healthRoutes from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Helpful startup check: verify the configured DATABASE_URL can be reached early
// so deploy logs show a clear hint when DNS/host resolution fails (e.g. ENOTFOUND 'base').
try {
  // run a tiny query to force the pool to attempt a connection
  await pool.query('SELECT 1');
  // Ensure we have a sensible search_path so unqualified CREATE/ALTER statements
  // operate in the 'public' schema. Some hosted Postgres instances require an
  // explicit search_path or will error with "no schema has been selected to create in".
  try {
    await pool.query("SET search_path TO public");
  } catch (spErr) {
    console.warn('Could not set search_path to public at startup:', spErr && spErr.message ? spErr.message : spErr);
  }
} catch (e) {
  console.error('\nFATAL: cannot connect to the database at startup.');
  console.error('Check your DATABASE_URL environment variable; Render should have a valid Postgres URL like:');
  console.error("  postgres://username:password@HOST:PORT/dbname\n");
  console.error('Error details:', e && e.message ? e.message : e);
  // Exit with non-zero to fail the deploy quickly and clearly
  process.exit(1);
}

try {
  await addColumnsIfMissing('standings', {
    points: 'points INTEGER DEFAULT 0',
    tournaments_played: 'tournaments_played INTEGER DEFAULT 0'
  })
} catch (e) {
  console.error('Could not ensure standings columns:', e.message)
}


// If your app uses tournament_points, ensure minimal columns exist.
// If you don't use it, you can skip this block entirely.
await addColumnsIfMissing('tournament_points', {
  player_id: 'player_id INTEGER',
  tournament_id: 'tournament_id INTEGER',
  points: 'points INTEGER DEFAULT 0'
})

// Ensure tournaments can store per-tournament points configuration (JSON)
try {
  await addColumnsIfMissing('tournaments', {
    points_by_round: 'points_by_round TEXT'
  });
} catch (e) {
  console.warn('Could not ensure tournaments.points_by_round:', e && e.message ? e.message : e);
}

const app = express();

// ----- Security & platform basics -----
app.enable('trust proxy'); // so req.secure works behind Render/Heroku/etc.

// Security headers early
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Environment
const isProd = process.env.NODE_ENV === 'production';

// Force HTTPS in production only
app.use((req, res, next) => {
  if (!isProd) return next();
  // Don't force-redirect to HTTPS for local development hosts even if
  // NODE_ENV=production is set locally (helps developers testing on localhost).
  const host = String(req.headers.host || '').toLowerCase();
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return next();

  const xfProto = req.get('x-forwarded-proto');
  if (req.secure || xfProto === 'https') return next();
  return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
});

// ----- CORS (dev-friendly; strict in prod) -----
const allowed = new Set(
  [
    process.env.CLIENT_URL,         // e.g. https://your-site.onrender.com
    process.env.ADMIN_URL,
    'capacitor://localhost',
    // Render frontend URLs
    'https://club-booking-app-1.onrender.com',
    'https://club-booking-app.onrender.com',
    // Add common variations
    'https://club-booking-app-client.onrender.com',
  ].filter(Boolean)
);
const allowOnrenderRegex = /^https:\/\/.+\.onrender\.com$/;

// Allow localhost and common LAN IP ranges in dev (so phones on Wi-Fi can test)
const devRegex =
  /^(http:\/\/(localhost|127\.0\.0\.1)(:\d+)?|http:\/\/(?:10|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d+\.\d+(?::\d+)?)/;

const corsOptions = {
  origin(origin, cb) {
    // Debug logging for CORS issues
    console.log(`[CORS] Checking origin: ${origin}`);
    
    // Non-browser clients like curl/postman send no Origin
    if (!origin) return cb(null, true);

    // Dev: allow localhost + LAN IPs
    if (!isProd && devRegex.test(origin)) {
      console.log(`[CORS] Allowing dev origin: ${origin}`);
      return cb(null, true);
    }

    // Prod: only explicit allowlist + *.onrender.com
    if (allowed.has(origin)) {
      console.log(`[CORS] Allowing from allowlist: ${origin}`);
      return cb(null, true);
    }
    
    if (allowOnrenderRegex.test(origin)) {
      console.log(`[CORS] Allowing *.onrender.com: ${origin}`);
      return cb(null, true);
    }

    console.error(`[CORS] BLOCKED origin: ${origin}`);
    console.log(`[CORS] Allowed origins:`, Array.from(allowed));
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

// Use the dynamic corsOptions (defined above) but ensure we also expose
// the allowed HTTP methods and headers for browser preflight checks.
const corsOptionsWithMethods = {
  ...corsOptions,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-version'],
};

app.use(cors(corsOptionsWithMethods));
app.options('*', cors(corsOptionsWithMethods)); // preflight

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Body parser - increased limit for image uploads in feedback
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve client static build when deployed in production and the build exists.
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  try {
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      // Serve index.html for any unknown route (SPA fallback)
      app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
      console.log('Serving built client from', clientDist);
    } else {
      console.warn('Client dist not found; static files will not be served from server.');
    }
  } catch (e) {
    console.warn('Failed to enable static client serving:', e && e.message ? e.message : e);
  }
}

// Mount health check routes
app.use('/health', healthRoutes);

// env check
app.get('/__envcheck', async (req, res) => {
  const k = process.env.RESEND_API_KEY || '';
  const masked = k ? `${k.slice(0,6)}…${k.slice(-4)}` : '';
  res.json({
    has_RESEND_API_KEY: Boolean(k),
    RESEND_API_KEY_masked: masked,
    FROM_EMAIL: process.env.FROM_EMAIL,
    APP_BASE_URL: process.env.APP_BASE_URL
  });
});

// test send (replace with your real inbox before calling)
// app.post('/__sendtest', express.json(), async (req, res) => {
//   const to = req.body?.to;
//   if (!to) return res.status(400).json({ ok: false, error: 'Provide "to" in JSON body' });

//   const result = await sendEmail({
//     to,
//     subject: 'Test from Club Booking',
//     html: '<p>Hello from Resend ✅</p>',
//   });

//   return res.status(result.ok ? 200 : 500).json(result); // ← don’t wrap in { ok: result }
// });

app.get('/__envcheck', async (req, res) => {
  const k = process.env.RESEND_API_KEY || '';
  res.json({
    has_RESEND_API_KEY: !!k,
    RESEND_API_KEY_masked: k ? `${k.slice(0,6)}…${k.slice(-4)}` : '',
    FROM_EMAIL: process.env.FROM_EMAIL,
    APP_BASE_URL: process.env.APP_BASE_URL
  });
});

// tournament_points table (idempotent)
db.prepare(`
  CREATE TABLE IF NOT EXISTS tournament_points (
    tournament_id INTEGER NOT NULL,
    round INTEGER NOT NULL,   -- 1=Final, 2=SF, 3=QF, ... (larger number = earlier round)
    points INTEGER NOT NULL,
    PRIMARY KEY (tournament_id, round),
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
  )
`).run();

// --- Postgres bootstrap for standings & tournament points (no SQLite helpers) ---
async function ensureRankingsSchema() {
  // standings table (per user per club)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS standings (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      points INTEGER NOT NULL DEFAULT 0,
      tournaments_played INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, club_id)
    );
  `);

  // be idempotent if table already existed
  await pool.query(`ALTER TABLE standings ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE standings ADD COLUMN IF NOT EXISTS tournaments_played INTEGER NOT NULL DEFAULT 0`);

  // optional tournament points config (one per club+sport)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournament_points (
      id BIGSERIAL PRIMARY KEY,
      club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      sport TEXT NOT NULL DEFAULT 'tennis',
      r16 INTEGER NOT NULL DEFAULT 0,
      qf  INTEGER NOT NULL DEFAULT 0,
      sf  INTEGER NOT NULL DEFAULT 0,
      f   INTEGER NOT NULL DEFAULT 0,
      w   INTEGER NOT NULL DEFAULT 0,
      UNIQUE (club_id, sport)
    );
  `);

  // Ensure tournaments table has seeds_count (used by bracket code)
  await pool.query(`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS seeds_count INTEGER`);

  // Ensure matches table has commonly-used columns that the server expects.
  // Some older installs may lack score/status columns; add them idempotently.
  try {
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_score INTEGER`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_score INTEGER`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id INTEGER`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT`);
  } catch (e) {
    // best-effort: if ALTER fails (e.g., table doesn't exist yet), log and continue
    console.warn('ensureRankingsSchema: could not ensure matches columns:', e.message || e);
  }
}

// call this once during startup (after pool is imported and ready)
await ensureRankingsSchema();

// Ensure clubs table has a timezone column so bookings can be validated
try {
  // Ensure the minimal set of columns the server expects exist. Many older
  // installs may have a trimmed `clubs` table; add missing columns idempotently
  // so server code that references them will not crash on deploy.
  await addColumnsIfMissing('clubs', {
    sport: "sport TEXT NOT NULL DEFAULT 'tennis'",
    code:  "code TEXT",
    manager_id: 'manager_id BIGINT',
    timezone: "timezone TEXT"
  });
} catch (e) {
  console.warn('Could not ensure clubs.timezone:', e && e.message ? e.message : e);
}

// Create manager account if missing (best-effort)
await ensureManagerAccount();

// NOTE: temporary admin create-manager endpoint removed for security.
// If you still need to create an admin user in environments without shell access,
// run the idempotent scripts in server/scripts/ locally against your DATABASE_URL
// or temporarily re-add a protected endpoint. Do NOT leave admin tokens active in prod.

// Ensure a manager user exists (safe idempotent startup helper)
async function ensureManagerAccount() {
  try {
    const managerUsername = 'leolinquet';
    const managerPassword = '1234';

    // Inspect users table for a suitable lookup column and check existence case-insensitively
    const uInfo = await tableInfo('users');
    const uCols = (uInfo || []).map(c => c.name);
    const lookupCandidates = ['username', 'display_name', 'name', 'email'];
    const lookupCol = lookupCandidates.find(c => uCols.includes(c));
    if (lookupCol) {
      try {
        const existing = await one(`SELECT id FROM users WHERE LOWER(${lookupCol})=LOWER($1) LIMIT 1`, managerUsername);
        if (existing) {
          console.log('Manager account already exists:', managerUsername);
          return;
        }
      } catch (e) {
        console.warn('ensureManagerAccount: lookup query failed, continuing to creation:', e && e.message ? e.message : e);
      }
    } else {
      console.warn('ensureManagerAccount: no lookup column found on users table; will attempt to insert a manager row');
    }

    // Hash the password
    const password_hash = await bcrypt.hash(managerPassword, 10);

  // Inspect available users columns and insert a compatible row (reuse uCols from above)
    const insertCols = [];
    const insertVals = [];

  if (uCols.includes('display_name')) { insertCols.push('display_name'); insertVals.push(managerUsername); }
    if (uCols.includes('username'))     { insertCols.push('username'); insertVals.push(managerUsername); }
    if (uCols.includes('email'))        { insertCols.push('email'); insertVals.push(`${managerUsername}@example.com`); }
    if (uCols.includes('password_hash')){ insertCols.push('password_hash'); insertVals.push(password_hash); }
    if (uCols.includes('role'))         { insertCols.push('role'); insertVals.push('manager'); }
    if (uCols.includes('is_manager'))   { insertCols.push('is_manager'); insertVals.push(true); }
    if (uCols.includes('email_verified_at')) { insertCols.push('email_verified_at'); insertVals.push(new Date().toISOString()); }

    if (!insertCols.length) {
      console.warn('No compatible users columns found to create manager account. Skipping creation.');
      return;
    }

    // Build parameterized SQL ($1..)
    const placeholders = insertVals.map((_, i) => `$${i+1}`).join(', ');
    const sql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    await pool.query(sql, insertVals);
    console.log('Created manager account:', managerUsername);
  } catch (e) {
    console.warn('Could not ensure manager account:', e && e.message ? e.message : e);
  }
}

// Ensure a dedicated per-tournament results table exists separately from
// the historical/per-round `tournament_points` config table. Some installs
// historically used the same name for different purposes which created
// collisions. Create a clear results table `tournament_player_points` that
// stores the points awarded to each player for a tournament.
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournament_player_points (
      tournament_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      placement INTEGER,
      PRIMARY KEY (tournament_id, player_id),
      FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    )
  `);
} catch (e) {
  console.warn('Could not ensure tournament_player_points table:', e && e.message ? e.message : e);
}

// Ensure tournaments table has draw_size column
try {
  await addColumnsIfMissing('tournaments', { draw_size: 'draw_size INTEGER' });
} catch (e) {
  console.warn('Could not ensure tournaments.draw_size:', e && e.message ? e.message : e);
}

// -------------------------------
// Utilities
// -------------------------------
function nowDateTime() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return { date, time: `${hh}:${mm}` };
}

// Return current date/time strings (YYYY-MM-DD, HH:MM) in the provided IANA timezone.
// Falls back to UTC when timezone is missing or invalid.
function nowInTimeZone(timeZone) {
  try {
    const dt = DateTime.now().setZone(timeZone || 'UTC');
    return { date: dt.toISODate(), time: dt.toFormat('HH:mm') };
  } catch (e) {
    return nowDateTime();
  }
}

// Password strength: at least 5 characters, at least one uppercase letter, at least one digit
function isStrongPassword(pw) {
  if (!pw || typeof pw !== 'string') return false;
  if (pw.length < 5) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
}

async function getClubNow(clubId) {
  try {
    const row = await db.prepare('SELECT timezone FROM clubs WHERE id = ?').get(Number(clubId));
    const hostTz = DateTime.now().zoneName || 'UTC';
    const tz = row && row.timezone ? String(row.timezone) : (process.env.DEFAULT_TIMEZONE || hostTz || 'UTC');
    return nowInTimeZone(tz);
  } catch (e) {
    return nowDateTime();
  }
}

// -------------------------------
// Auth
// -------------------------------
// ---------- AUTH: register (transactional find-or-create) ----------
// helper: normalize role
const normalizeRole = r => (r === 'manager' ? 'manager' : 'player');

app.post('/auth/register', async (req, res) => {
  try {
    // IMPORTANT: use "username" (not "name")
    const { username, email, password, role } = req.body || {};
    if ((!username && !email) || !password) {
      return res.status(400).json({ error: 'username/email and password required' });
    }

    // enforce password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'password must be at least 5 characters, include 1 uppercase letter and 1 number' });
    }

    const targetRole = normalizeRole(role);
    const isManager = targetRole === 'manager';

    // reject duplicates (case-insensitive)
    const dup = await pool.query(
      `SELECT id FROM users
        WHERE ($1::text IS NOT NULL AND LOWER(username)=LOWER($1::text))
           OR ($2::text IS NOT NULL AND LOWER(email)=LOWER($2::text))
        LIMIT 1`,
      [username || null, email || null]
    );
    if (dup.rows.length) {
      return res.status(409).json({ error: 'username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Compute a display_name (required by schema)
    let display_name = null;
    if (username) display_name = String(username).trim();
    else if (email) display_name = String(email).split('@')[0];
    else display_name = `user${Math.floor(Math.random() * 100000)}`;

    const ins = await pool.query(
      `INSERT INTO users (display_name, username, email, password_hash, role, is_manager)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, display_name, username, email, role, is_manager`,
      [display_name, username?.toLowerCase() || null, email?.toLowerCase() || null, password_hash, targetRole, isManager]
    );

    res.status(201).json({ user: ins.rows[0] });
  } catch (e) {
    console.error('POST /auth/register', e.code || e.message, e);
    res.status(500).json({ error: e.code || 'unexpected error' });
  }
});

// Compatibility: client calls POST /auth/signup — provide a thin wrapper that
// accepts { email, password, name } and behaves like /auth/register.
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    // enforce password strength for signup
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'password must be at least 5 characters, include 1 uppercase letter and 1 number' });
    }

    // reject duplicates (case-insensitive)
    const dup = await pool.query(
      `SELECT id FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1`,
      [email]
    );
    if (dup.rows.length) return res.status(409).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const display_name = (name && String(name).trim()) || String(email).split('@')[0];
    const username = String(display_name).trim().toLowerCase().replace(/\s+/g, '') || null;

    const ins = await pool.query(
      `INSERT INTO users (display_name, username, email, password_hash, role, is_manager, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, display_name, username, email, role, is_manager`,
      [display_name, username, email.toLowerCase(), password_hash, 'player', false]
    );

    return res.status(201).json({ user: ins.rows[0] });
  } catch (e) {
    if (e?.code === '23505') {
      return res.status(409).json({ error: 'Email or username already in use' });
    }
    console.error('POST /auth/signup', e?.code || e?.message || e);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const identifier = String(
      req.body?.login ??
      req.body?.identifier ??
      req.body?.email ??
      req.body?.username ??
      ''
    ).trim();
    const password = String(req.body?.password ?? '');
    if (!identifier) return res.status(400).json({ error: 'login required' });

    // introspect available columns
    const cols = (await tableInfo('users')).map(c => c.name);
    const ucols = new Set(cols);

    // SELECT list (only columns that exist)
    const select = ['id'];
    if (ucols.has('display_name')) select.push('display_name');
    else if (ucols.has('username')) select.push('username AS display_name');
    else if (ucols.has('name'))     select.push('name AS display_name');
    if (ucols.has('email'))         select.push('email');
    if (ucols.has('password_hash')) select.push('password_hash');
    if (ucols.has('role'))          select.push('role');
    if (ucols.has('is_manager'))    select.push('is_manager');

    // WHERE predicates (build only from real cols)
    const preds = [];
    if (ucols.has('email'))         preds.push('LOWER(email) = LOWER($1)');
    if (ucols.has('display_name'))  preds.push('LOWER(display_name) = LOWER($1)');
    if (ucols.has('username'))      preds.push('LOWER(username) = LOWER($1)');
    if (ucols.has('name'))          preds.push('LOWER(name) = LOWER($1)');

    const where  = preds.length ? preds.join(' OR ') : 'FALSE';
    const params = preds.length ? [identifier] : [];   // ← IMPORTANT

    // DEBUG: log lookup details to help diagnose login failures in dev
    try {
      console.debug('[auth/login] lookup', { select: select.join(', '), where, params });
    } catch (e) {}

    const user = await one(
      `SELECT ${select.join(', ')} FROM users WHERE ${where} LIMIT 1`,
      ...params
    );
    try {
      console.debug('[auth/login] userRow', user && { id: user.id, email: user.email, display_name: user.display_name });
    } catch (e) {}
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    // check password only if a valid hash exists
    const mustCheck = ucols.has('password_hash') && user.password_hash;
    if (mustCheck) {
      try {
        const ok = bcrypt.compareSync(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'invalid credentials' });
      } catch {
        return res.status(400).json({ error: 'stored password is invalid; ask admin to reset' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        display_name: user.display_name,
        role: user.role,
        is_manager: !!user.is_manager
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.display_name ?? null,   // alias for older UI
        display_name: user.display_name ?? null,
        email: user.email ?? null,
        role: user.role ?? 'player',
        is_manager: !!user.is_manager,
      }
    });
  } catch (e) {
    console.error('login error', e);
    res.status(500).json({ error: 'server error' });
  }
});

// -------------------------------
// Tournament helpers
// -------------------------------

// Round numbering convention:
//   round=1 => Final
//   round=2 => Semifinal
//   round=3 => Quarterfinal
//   ... up to round = log2(drawSize)
//
// drawSize must be a power of two from 4..128.

function roundCountFor(drawSize) {
  // e.g., 4->2 rounds; 8->3; 16->4; 128->7
  return Math.log2(drawSize);
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function canonicalRounds(drawSize) {
  // returns [R128,R64,R32,R16,QF,SF,F] filtered to needed size, mapped to round number
  const labels = [
    { label: 'R128', size: 128 },
    { label: 'R64',  size:  64 },
    { label: 'R32',  size:  32 },
    { label: 'R16',  size:  16 },
    { label: 'QF',   size:   8 },
    { label: 'SF',   size:   4 },
    { label: 'F',    size:   2 },
  ];
  const needed = labels.filter(l => l.size <= drawSize);
  // map to (roundNumber, label); roundNumber grows with earlier rounds
  // e.g., for draw 16: R16(round=4), QF(3), SF(2), F(1)
  return needed.map((l, idx) => ({
    label: l.label,
    round: needed.length - idx, // final=1
  }));
}

// ---- helpers: canonical bracket order ----
function nextPow2(n){ let p = 1; while (p < n) p <<= 1; return p; }

// 1, N, then recurse halves → produces the standard positions for 1..drawSize
function pairingOrder(drawSize){
  function rec(n){
    if (n === 1) return [1];
    const prev = rec(n/2);
    const mirr = prev.map(x => n + 1 - x);
    return [...prev, ...mirr];
  }
  return rec(drawSize); // 1-based
}

// ---- compute seeds + randomized rest (unchanged idea, tiny tweaks) ----
async function computeSeedingOrder({ clubId, sport, playerIds, seedCount }) {
  const rows = await db.prepare(`
    SELECT p.id as player_id, s.points as pts
    FROM players p
    LEFT JOIN standings s
      ON s.player_id = p.id AND s.club_id = p.club_id AND s.sport = ?
    WHERE p.club_id = ? AND p.id IN (${playerIds.map(()=>'?').join(',')})
  `).all(sport, clubId, ...playerIds);

  const ptsMap = new Map(rows.map(r => [r.player_id, r.pts ?? 0]));

  // Sort by points desc, stable by id to break ties deterministically
  const ranked = [...playerIds]
    .map(pid => ({ pid, pts: ptsMap.get(pid) ?? 0 }))
    .sort((a,b)=> b.pts - a.pts || (a.pid - b.pid));

  const k = Math.min(seedCount || 0, ranked.length);
  const seeds = ranked.slice(0, k).map(r => r.pid);
  const rest  = ranked.slice(k).map(r => r.pid);

  // Fisher–Yates shuffle for unseeded
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  return { seeds, rest };
}

// ---- place seeds into bracket slots; fill others randomly ----
async function buildSeededSlots({ playerIds, seedCount, clubId, sport }) {
  const drawSize = nextPow2(playerIds.length);
  const { seeds, rest } = await computeSeedingOrder({ clubId, sport, playerIds, seedCount });

  const order = pairingOrder(drawSize);       // e.g., [1, N, N/4+1, ...]
  const slots = Array(drawSize).fill(null);   // each entry: { playerId, seed|null }

  // place seeds in canonical positions
  for (let i = 0; i < seeds.length; i++) {
    const pos = order[i] - 1;                 // 0-based slot index
    slots[pos] = { playerId: seeds[i], seed: i + 1 };
  }

  // fill the rest (already shuffled) into remaining open slots
  let u = 0;
  for (let i = 0; i < drawSize && u < rest.length; i++) {
    if (!slots[i]) slots[i] = { playerId: rest[u++], seed: null };
  }

  // any trailing nulls are BYEs if drawSize > entrants
  return { slots, drawSize };
}

// ---- first-round pairing from slots: (0 vs 1), (2 vs 3), ... ----
function makeFirstRoundMatches(slots){
  const matches = [];
  for (let i = 0; i < slots.length; i += 2) {
    matches.push({ p1: slots[i] || null, p2: slots[i+1] || null });
  }
  return matches;
}

function awardPointsOnElimination({ tournamentId, clubId, sport, loserPlayerId, roundNumber }) {
  const row = db.prepare(`
    SELECT points FROM tournament_points WHERE tournament_id=? AND round=?
  `).get(tournamentId, roundNumber);
  const pts = row ? row.points : 0;

  // upsert standings for that (club, sport, player)
  const existing = db.prepare(`
    SELECT id, played, won, drawn, lost, gf, ga, points
    FROM standings WHERE club_id=? AND sport=? AND player_id=? AND season='default'
  `).get(clubId, sport, loserPlayerId);

  if (!existing) {
    db.prepare(`
      INSERT INTO standings (club_id, sport, player_id, season, played, points)
      VALUES (?, ?, ?, 'default', 0, ?)
    `).run(clubId, sport, loserPlayerId, pts);
  } else {
    db.prepare(`UPDATE standings SET points = ? WHERE id = ?`)
      .run(existing.points + pts, existing.id);
  }
}

function awardPointsToChampion({ tournamentId, clubId, sport, winnerPlayerId }) {
  // Final round = 1
  const row = db.prepare(`
    SELECT points FROM tournament_points WHERE tournament_id=? AND round=1
  `).get(tournamentId);
  const pts = row ? row.points : 0;

  const existing = db.prepare(`
    SELECT id, points FROM standings WHERE club_id=? AND sport=? AND player_id=? AND season='default'
  `).get(clubId, sport, winnerPlayerId);

  if (!existing) {
    db.prepare(`
      INSERT INTO standings (club_id, sport, player_id, season, played, points)
      VALUES (?, ?, ?, 'default', 0, ?)
    `).run(clubId, sport, winnerPlayerId, pts);
  } else {
    db.prepare(`UPDATE standings SET points = ? WHERE id = ?`)
      .run(existing.points + pts, existing.id);
  }
}

async function deleteTournamentById(tId) {
  // Delete children first; do NOT modify standings table
  await db.prepare(`DELETE FROM matches WHERE tournament_id=?`).run(tId);
  // tournament_points is optional in some installs
  const hasTP = await tableExists('tournament_points');
  if (hasTP) await db.prepare(`DELETE FROM tournament_points WHERE tournament_id=?`).run(tId);
  await db.prepare(`DELETE FROM tournament_players WHERE tournament_id=?`).run(tId);
  await db.prepare(`DELETE FROM tournaments WHERE id=?`).run(tId);
}

// -------------------------------
// Tournaments & Rankings
// -------------------------------

// Create a single-elim tournament with per-round points config
// body: { name, sport, drawSize, seedCount, pointsByRound: { R128,R64,R32,R16,QF,SF,F,C }, managerId }
app.post('/clubs/:clubId/tournaments', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { name, sport, drawSize, seedCount, pointsByRound = {}, managerId } = req.body ?? {};

    // --- basic validation ---------------------------------------------------
    if (!name || !sport || !drawSize || !seedCount || !managerId) {
      return res.status(400).json({ error: 'missing fields' });
    }
    // ensure numeric and finite to avoid 'NaN' creeping into SQL
    const Ndraw = Number(drawSize);
    const Nseed = Number(seedCount);
    if (!Number.isFinite(Ndraw) || ![4, 8, 16, 32, 64, 128].includes(Ndraw)) {
      return res.status(400).json({ error: 'drawSize must be one of 4,8,16,32,64,128' });
    }
    if (!Number.isFinite(Nseed) || ![2, 4, 8, 16, 32].includes(Nseed)) {
      return res.status(400).json({ error: 'seedCount must be one of 2,4,8,16,32' });
    }

    // --- manager check ------------------------------------------------------
    const clubRow = await get('SELECT manager_id FROM clubs WHERE id=$1', clubId);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can create tournaments' });
    }

    // --- detect available columns (keep writes minimal) ---------------------
    const tCols = (await tableInfo('tournaments')).map(c => c.name);
    const payload = {};
    if (tCols.includes('club_id'))      payload.club_id      = clubId;
    if (tCols.includes('sport'))        payload.sport        = String(sport);
    if (tCols.includes('name'))         payload.name         = String(name);
    if (tCols.includes('status'))       payload.status       = 'active';
    if (tCols.includes('format'))       payload.format       = 'single_elim';
    if (tCols.includes('start_date'))   payload.start_date   = null;
    if (tCols.includes('end_date'))     payload.end_date     = null;
    if (tCols.includes('block_courts')) payload.block_courts = 0;
  if (tCols.includes('draw_size'))    payload.draw_size    = Ndraw;
  if (tCols.includes('seed_count'))   payload.seed_count   = Nseed;

    const keys = Object.keys(payload);
    if (!keys.length) {
      return res.status(500).json({ error: 'tournaments table has no compatible columns' });
    }
    const vals = keys.map(k => payload[k]);
    const ph   = keys.map((_, i) => `$${i + 1}`).join(', ');

    // --- duplicate guard (best effort; skip if columns absent) --------------
    try {
      const dup = await get(
        'SELECT id FROM tournaments WHERE club_id=$1 AND sport=$2 AND name=$3',
        payload.club_id, payload.sport, payload.name
      );
      if (dup) {
        return res.status(409).json({ error: 'A tournament with this name and sport already exists for this club.' });
      }
    } catch { /* ignore if any of those columns are missing */ }

    // --- insert tournament ---------------------------------------------------
    const row = await get(
      `INSERT INTO tournaments (${keys.join(', ')}) VALUES (${ph}) RETURNING id`,
      ...vals
    );
    // persist the pointsByRound JSON if the column exists
    if (tCols.includes('points_by_round')) {
      try {
        await db.prepare(`UPDATE tournaments SET points_by_round = ? WHERE id = ?`).run(JSON.stringify(pointsByRound || {}), Number(row.id));
      } catch (e) {
        console.warn('Failed to persist points_by_round for tournament', row.id, e && e.message ? e.message : e);
      }
    }
    // Ensure draw_size and seed_count are stored as well (update in case columns were added dynamically)
    try {
      await db.prepare(`UPDATE tournaments SET draw_size = ?, seed_count = ? WHERE id = ?`).run(Ndraw, Nseed, Number(row.id));
    } catch (e) {
      // ignore if columns don't exist
    }
    const tId = Number(row.id);

    res.json({ ok: true, tournament: { id: tId, name: String(name), sport: String(sport) } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});


// body: { playerIds?: number[], userIds?: number[], managerId }
app.post('/tournaments/:id/players', async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { userIds = [], usernames = [], managerId } = req.body || {};

    const t = await db.prepare('SELECT id, club_id, sport, name FROM tournaments WHERE id=?').get(tId);
    if (!t) return res.status(404).json({ error: `tournament ${tId} not found in DB` });

    // only the club manager can add
    const clubRow = await db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can add players' });
    }

    // 1) resolve usernames -> user ids (robust: try username, display_name, email case-insensitively)
    const ids = new Set(userIds.map(n => Number(n)).filter(Boolean));
    const notFound = [];
    const ambiguous = [];
    for (const raw of usernames) {
      const name = String(raw).trim();
      if (!name) continue;

      // Inspect available users columns so we pick realistic lookup columns
      const uCols = (await tableInfo('users')).map(c => c.name);
      const whereParts = [];
      const params = [];
      if (uCols.includes('username')) { whereParts.push('LOWER(username)=LOWER(?)'); params.push(name); }
      if (uCols.includes('display_name')) { whereParts.push('LOWER(display_name)=LOWER(?)'); params.push(name); }
      if (uCols.includes('email')) { whereParts.push('LOWER(email)=LOWER(?)'); params.push(name); }

      let matches = [];
      if (whereParts.length) {
        const sql = `SELECT id, username, display_name, email FROM users WHERE ${whereParts.join(' OR ')}`;
        try {
          matches = await db.prepare(sql).all(...params);
        } catch (e) {
          console.warn('Username lookup failed for', name, e && e.message ? e.message : e);
          matches = [];
        }
      }

      if (matches.length === 1) {
        ids.add(Number(matches[0].id));
      } else if (matches.length > 1) {
        // Ambiguous identifier: report the candidate matches so the manager can correct input
        ambiguous.push({ name, candidates: matches.map(m => (m.display_name || m.username || m.email || String(m.id))) });
      } else {
        notFound.push(name);
      }
    }
    if (ambiguous.length) {
      // Return a helpful error describing ambiguous entries and do not perform any writes
      return res.status(400).json({ error: 'Ambiguous usernames', ambiguous });
    }
    if (ids.size === 0) {
      return res.status(400).json({ error: notFound.length ? `Users not found: ${notFound.join(', ')}` : 'No valid users found' });
    }

    // 2) ensure players row exists for this club+user, then insert that players.id
    for (const uid of ids) {
      // upsert into players (club-scoped identity). display_name defaults to users.name
      // Insert or update the players row for this club+user. Ensure the
      // players.display_name is synced from users.display_name to avoid
      // stale or mismatched names that confuse the UI.
      await db.prepare(`
        INSERT INTO players (club_id, user_id, display_name)
        SELECT ?, ?, COALESCE(display_name, username, 'user' || ?) FROM users WHERE id = ?
        ON CONFLICT (club_id, user_id) DO UPDATE SET display_name = EXCLUDED.display_name
      `).run(t.club_id, Number(uid), Number(uid), Number(uid));


      const p = await db.prepare(`
        SELECT id, display_name FROM players WHERE club_id=? AND user_id=?
      `).get(t.club_id, Number(uid));

      // Log the upsert result so we can regress later if display_name mismatches occur
      try {
        console.log('players upsert:', { club_id: t.club_id, user_id: Number(uid), player_id: p && p.id, display_name: p && p.display_name });
      } catch (ie) {
        // don't allow logging failures to break the flow
      }

      if (!p || p.id == null) {
        // safety net: if user/player wasn't created properly, report a clear error
        notFound.push(String(uid));
        continue; // skip this uid but continue processing others
      }

      try {
        await db.prepare(`
          INSERT INTO tournament_players (tournament_id, player_id)
          VALUES (?, ?)
          ON CONFLICT (tournament_id, player_id) DO NOTHING
        `).run(tId, p.id);
      } catch (e) {
        console.error('Add player FK error', { tId, uid, playerId: p.id, tournament: t, msg: e.message });
        return res.status(500).json({ error: `FK failed for tournament_id=${tId}, player_id=${p.id}` });
      }
    }

    // return current list using players (and fallback to users.name)
    const current = await db.prepare(`
      SELECT tp.player_id, COALESCE(p.display_name, u.display_name) AS display_name
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE tp.tournament_id=?
      ORDER BY COALESCE(p.display_name, u.display_name) ASC
    `).all(tId);

    res.json({ players: current, notFound });
  } catch (e) {
    console.error('Error in /tournaments/:id/players:', e);
    res.status(500).json({ error: e.message || 'unexpected error' });
  }
});

// Auto-creates Round N matches with seeded placements.
// body: { drawSize, seedCount, managerId }
app.post('/tournaments/:id/generate', async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { drawSize, seedCount, managerId } = req.body || {};

    const t = await db.prepare('SELECT id, club_id, sport FROM tournaments WHERE id=?').get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const clubRow = await db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can generate bracket' });
    }

    const N = Number(drawSize);
    if (![4,8,16,32,64,128].includes(N)) {
      return res.status(422).json({ error: 'drawSize must be 4,8,16,32,64,128' });
    }
    
    // Check if tournament already has matches (prevent regeneration)
    const existingMatches = await db.prepare('SELECT COUNT(*) as count FROM matches WHERE tournament_id=?').get(tId);
    if (existingMatches && existingMatches.count > 0) {
      return res.status(409).json({ error: 'tournament bracket already generated' });
    }

    // Entrants with points for ranking (0 if none)
    let entrants = await db.prepare(`
      SELECT
        tp.player_id                                   AS player_id,
        COALESCE(p.display_name, u.display_name)       AS display_name,
        COALESCE(s.points, 0)                          AS pts
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN standings s
        ON s.player_id = tp.player_id AND s.club_id = ?
      WHERE tp.tournament_id = ?
    `).all(t.club_id, tId);

    // defensive: ensure entrants is an array (some DB adapters may misbehave)
    if (!Array.isArray(entrants)) {
      try {
        console.warn('Generate: entrants is not an array, inspecting', Object.prototype.toString.call(entrants));
      } catch (ie) {
        console.warn('Generate: entrants inspection failed', String(ie));
      }
      try {
        entrants = entrants ? Array.from(entrants) : [];
      } catch (coerceErr) {
        console.error('Generate: could not coerce entrants to array', String(coerceErr));
        entrants = [];
      }
    }

    const M = entrants.length;
    if (M === 0) return res.status(422).json({ error: 'need at least 1 player' });
    if (M > N)   return res.status(422).json({ error: `too many players (${M}); increase draw size or remove players` });

    // Rank entrants
    const ranked = [...entrants].sort((a,b) =>
      (b.pts ?? 0) - (a.pts ?? 0) ||
      a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }) ||
      (a.player_id - b.player_id)
    );

    // Seed count actually used (cannot exceed entrants)
    let S = Math.min(Number(seedCount) || 0, 32, N, M);

    const seeds = ranked.slice(0, S).map(e => e.player_id);
    const rest  = ranked.slice(S).map(e => e.player_id);

    // Preserve seed #1 and #2 canonical positions (1 -> top, 2 -> bottom).
    // Randomize orientation of seeds #3 and #4 when present so they may land
    // in either half (this matches common draw practices).
    if (S >= 4) {
      // 50% chance to swap seed 3 and seed 4
      if (Math.random() < 0.5) {
        const tmp = seeds[2];
        seeds[2] = seeds[3];
        seeds[3] = tmp;
      }
    }

    // Shuffle unseeded (Fisher–Yates)
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    // Canonical bracket order builder (1 top, 2 bottom, etc.)
    function positions(size) {
      function build(n) {
        if (n === 2) return [1, 2];
        const prev = build(n / 2);
        const out = [];
        for (let i = 0; i < prev.length; i++) {
          out.push(prev[i]);
          out.push(n + 1 - prev[i]);
        }
        return out;
      }
      return build(size);
    }
    const order = positions(N);

    // 0 = empty, -1 = reserved BYE for a top seed’s opponent
    const slots = new Array(N).fill(0);

    // place seeds by seed index -> slot
    for (let i = 0; i < S; i++) {
      const slotIndex = order[i] - 1;
      slots[slotIndex] = seeds[i];
    }
    // Reserve BYEs for top-ranked entrants (assign to highest-ranked players)
    // byes = number of empty slots that should be treated as BYEs (drawSize - entrants)
    const byes = N - M;

    // Build candidate lists: seeds in seed order, then other ranked players
    const seedSet = new Set(seeds);
    const rankedNotSeeded = ranked.map(r => r.player_id).filter(pid => !seedSet.has(pid));
    const orderPositions = order.map(x => x - 1);

    // Strong seed-first BYE assignment: ensure top-K seeds get BYEs in seed
    // order whenever possible. For each top seed, try to mark its opponent as
    // a BYE; if that opponent is occupied, attempt to move the occupant into
    // an empty non-seed slot or swap it with a low-priority non-seed slot so
    // the seed's opponent can become a BYE. After exhausting seeds, assign
    // any remaining BYEs to the next-ranked entrants.
    let byeAssigned = 0;
    const seedSlots = new Set(order.slice(0, S).map(x => x - 1));

    // First pass: top seeds
    for (let i = 0; i < S && byeAssigned < byes; i++) {
      const pid = seeds[i];
      const seedSlot = order[i] - 1;

      // ensure seed is in its canonical slot
      const curIndex = slots.findIndex(s => s === pid);
      if (curIndex !== -1 && curIndex !== seedSlot) {
        const tmp = slots[seedSlot];
        slots[seedSlot] = pid;
        slots[curIndex] = tmp;
      } else if (curIndex === -1) {
        slots[seedSlot] = pid;
      }

      const opp = seedSlot ^ 1;
      if (slots[opp] === 0) {
        // free opponent -> assign BYE
        slots[opp] = -1;
        byeAssigned++;
        continue;
      }

      if (slots[opp] > 0) {
        const occupant = slots[opp];

        // try: move occupant to an empty non-seed slot
        let emptyIndex = -1;
        for (let k = 0; k < N; k++) {
          if (slots[k] === 0 && !seedSlots.has(k) && k !== opp) { emptyIndex = k; break; }
        }
        if (emptyIndex !== -1) {
          slots[emptyIndex] = occupant;
          slots[opp] = -1;
          byeAssigned++;
          continue;
        }

        // try: swap occupant with a low-priority non-seed slot (not an opponent
        // of any earlier seed we've already reserved)
        const reservedOpps = new Set();
        for (let j = 0; j < i; j++) reservedOpps.add((order[j] - 1) ^ 1);

        let swapIndex = -1;
        for (let k = 0; k < N; k++) {
          if (slots[k] > 0 && !seedSlots.has(k) && !reservedOpps.has(k) && k !== opp) { swapIndex = k; break; }
        }
        if (swapIndex !== -1) {
          slots[swapIndex] = occupant;
          slots[opp] = -1;
          byeAssigned++;
          continue;
        }

        // no place to move occupant; fall through and defer this seed
      }
    }

    // Second pass: assign remaining BYEs to next-ranked (non-seeded) entrants
    if (byeAssigned < byes) {
      const orderedNonSeeds = rankedNotSeeded.slice();
      for (const pid of orderedNonSeeds) {
        if (byeAssigned >= byes) break;
        // find a canonical pair where we can place pid so its opponent becomes a BYE
        let foundDesired = -1;
        for (const desired of orderPositions) {
          const opp = desired ^ 1;
          if (slots[desired] === pid) { foundDesired = desired; break; }
          if (slots[desired] === 0 && slots[opp] === 0) { foundDesired = desired; break; }
        }
        if (foundDesired === -1) continue;

        const curIndex2 = slots.findIndex(s => s === pid);
        if (curIndex2 !== -1 && curIndex2 !== foundDesired) {
          const temp = slots[foundDesired];
          slots[foundDesired] = slots[curIndex2];
          slots[curIndex2] = temp;
        } else if (curIndex2 === -1) {
          slots[foundDesired] = pid;
        }

        const opp2 = foundDesired ^ 1;
        if (slots[opp2] === 0) {
          slots[opp2] = -1;
          byeAssigned++;
        } else if (slots[opp2] > 0) {
          const occupant2 = slots[opp2];
          const emptyIndex2 = slots.findIndex(s => s === 0);
          if (emptyIndex2 !== -1) {
            slots[emptyIndex2] = occupant2;
            slots[opp2] = -1;
            byeAssigned++;
          }
        }
      }
    }

    // Fill remaining with unseeded (rest); skip any rest entries already
    // placed above (we may have moved some into slots when assigning BYEs).
    let rIdx = 0;
    for (let i = 0; i < N && rIdx < rest.length; i++) {
      if (slots[i] === 0) {
        // advance rIdx past any players already placed into slots
        while (rIdx < rest.length && slots.includes(rest[rIdx])) rIdx++;
        if (rIdx < rest.length) {
          slots[i] = rest[rIdx++];
        }
      }
    }

    // Wipe old matches
    await db.prepare('DELETE FROM matches WHERE tournament_id=?').run(tId);

    // Persist seeds so UI can render badges
    await db.prepare(`UPDATE tournament_players SET seed = NULL WHERE tournament_id = ?`).run(tId);
    const setSeed = db.prepare(`UPDATE tournament_players SET seed = ? WHERE tournament_id = ? AND player_id = ?`);
    seeds.forEach((pid, idx) => setSeed.run(idx + 1, tId, pid)); // 1..S
    await db.prepare(`UPDATE tournaments SET seeds_count = ? WHERE id = ?`).run(S, tId);

    // Insert first round
    const firstRound = Math.log2(N);
    const hasStatus = new Set((await tableInfo('matches')).map(c => c.name)).has('status');
    const insertSQL = hasStatus
      ? `INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled')`
      : `INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`;
    const insertMatch = db.prepare(insertSQL);

    for (let s = 0; s < N / 2; s++) {
      const left  = slots[2 * s];
      const right = slots[2 * s + 1];
      const p1 = left  > 0 ? left  : null;  // -1/0 -> NULL (BYE)
      const p2 = right > 0 ? right : null;
      insertMatch.run(tId, firstRound, s, p1, p2);
    }

    // Auto-advance BYEs
    autoAdvanceByes(tId);

    res.json({ ok: true, round: firstRound, matches: N / 2 });
  } catch (e) {
    console.error('Generate bracket error:', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});


app.put('/matches/:id/result', async (req, res) => {
  try {
    const mId = Number(req.params.id);
    const { managerId, p1_score, p2_score } = req.body || {};
    
    // Validate required fields
    if (!managerId) return res.status(422).json({ error: 'managerId required' });

    const mResult = await pool.query('SELECT * FROM matches WHERE id=$1', [mId]);
    const m = mResult.rows[0];
    if (!m) return res.status(404).json({ error: 'match not found' });

    // Check if match is already completed
    if (m.winner_id) {
      return res.status(409).json({ error: 'match already completed' });
    }

    // Check if this is a BYE match (should not allow score entry)
    if (!m.p1_id || !m.p2_id) {
      return res.status(409).json({ error: 'cannot enter scores for BYE matches' });
    }

    // Validate scores
    const s1 = Number(p1_score);
    const s2 = Number(p2_score);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) {
      return res.status(422).json({ error: 'invalid scores - must be numbers' });
    }
    if (s1 === s2) {
      return res.status(422).json({ error: 'scores must not tie' });
    }
    if (s1 < 0 || s2 < 0) {
      return res.status(422).json({ error: 'scores must be non-negative' });
    }

    const winnerId = s1 > s2 ? m.p1_id : m.p2_id;

  console.log('Save result: match', mId, 'winnerId', winnerId, 'round', m.round, 'slot', m.slot);

    const mColsInfo = await tableInfo('matches');
    const mCols = new Set(mColsInfo.map(c => c.name));
    const notnull = Object.fromEntries(mColsInfo.map(c => [c.name, c.notnull]));


    const setParts = [];
    const vals = [];
    if (mCols.has('p1_score')) { setParts.push('p1_score=$' + (vals.length + 1)); vals.push(s1); }
    if (mCols.has('p2_score')) { setParts.push('p2_score=$' + (vals.length + 1)); vals.push(s2); }
    if (mCols.has('winner_id')) { setParts.push('winner_id=$' + (vals.length + 1)); vals.push(winnerId); }
    if (mCols.has('status')) setParts.push("status='completed'");
    if (mCols.has('updated_at')) setParts.push('updated_at=CURRENT_TIMESTAMP');
    if (!setParts.length) return res.status(500).json({ error: 'matches table missing expected columns' });
    await pool.query(`UPDATE matches SET ${setParts.join(', ')} WHERE id=$${vals.length + 1}`, [...vals, mId]);

    const nextRound = Number(m.round) - 1;
    if (Number.isFinite(nextRound) && nextRound >= 1) {
      console.log('Advancing winner to nextRound', nextRound);

      // compute next slot index (integer division)
      const nextSlot = Math.floor(Number(m.slot) / 2);
      console.log('Computed nextSlot', nextSlot);

      // Determine which side of the next match this winner should occupy
      const myField = (Number(m.slot) % 2 === 0) ? 'p1_id' : 'p2_id';
      const otherField = myField === 'p1_id' ? 'p2_id' : 'p1_id';

      // Try to find an existing next match
      let nextResult = await pool.query('SELECT * FROM matches WHERE tournament_id=$1 AND round=$2 AND slot=$3', [m.tournament_id, nextRound, nextSlot]);
      let next = nextResult.rows[0] || null;
      console.log('Existing next match?', !!next, next && { id: next.id, p1_id: next.p1_id, p2_id: next.p2_id });

      // helper to insert a new next match (uses status column if present)
      const insertNext = async (p1, p2) => {
        if (mCols.has('status')) {
          await pool.query(`INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status)
            VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, 'scheduled')`, [m.tournament_id, nextRound, nextSlot, p1, p2]);
        } else {
          await pool.query(`INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id)
            VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL)`, [m.tournament_id, nextRound, nextSlot, p1, p2]);
        }
        const nextResult = await pool.query('SELECT * FROM matches WHERE tournament_id=$1 AND round=$2 AND slot=$3', [m.tournament_id, nextRound, nextSlot]);
        next = nextResult.rows[0] || null;
        return next;
      };

      if (!next) {
        // No next match yet: check sibling in current round for its winner
        const siblingSlot = (Number(m.slot) % 2 === 0) ? Number(m.slot) + 1 : Number(m.slot) - 1;
        const siblingResult = await pool.query('SELECT * FROM matches WHERE tournament_id=$1 AND round=$2 AND slot=$3', [m.tournament_id, m.round, siblingSlot]);
        const sibling = siblingResult.rows[0] || null;
        const siblingWinner = sibling && Number(sibling.winner_id) ? Number(sibling.winner_id) : null;
        console.log('Sibling slot', siblingSlot, 'found?', !!sibling, 'siblingWinner', siblingWinner);

        // If sibling already has a winner, create a full next match with both players
        if (siblingWinner != null) {
          const p1 = myField === 'p1_id' ? winnerId : siblingWinner;
          const p2 = myField === 'p1_id' ? siblingWinner : winnerId;
          try {
            await insertNext(p1, p2);
            console.log('Inserted next match with both players', { p1, p2, nextSlot });
          } catch (ie) {
            console.error('Failed to insert next match (both players):', ie && ie.message ? ie.message : ie);
          }
        } else {
          // sibling has no winner yet: create a partial next-match only if columns allow NULLs
          const myNN = notnull[myField] === 1;
          const otherNN = notnull[otherField] === 1;
          if (!myNN || !otherNN) {
            const p1 = myField === 'p1_id' ? winnerId : null;
            const p2 = myField === 'p1_id' ? null : winnerId;
            try {
              await insertNext(p1, p2);
              console.log('Inserted partial next match for BYE/placeholder', { p1, p2, nextSlot });
            } catch (ie) {
              console.error('Failed to insert partial next match:', ie && ie.message ? ie.message : ie);
            }
          } else {
            // cannot create placeholder because schema requires both players; wait for sibling
            console.log('Not creating partial next match because both p1_id and p2_id are NOT NULL');
          }
        }
      }

      // If next now exists, ensure our winner is placed into the correct field
      if (next) {
        const field = myField;
        if (next[field] == null) {
          try {
            await pool.query(`UPDATE matches SET ${field}=$1 WHERE id=$2`, [winnerId, next.id]);
            console.log('Updated next match field', field, 'with', winnerId, 'nextId', next.id);
          } catch (ie) {
            console.error('Failed to update next match field:', ie && ie.message ? ie.message : ie);
          }
        }
      }
    } else {
      const tCols = new Set((await tableInfo('tournaments')).map(c => c.name));
      const tParts = [];
      const tVals = [];
      if (tCols.has('status')) tParts.push("status=$" + (tVals.length + 1)), tVals.push('completed');
      if (tCols.has('end_date')) tParts.push("end_date=COALESCE(end_date, now())");
      if (tParts.length) await pool.query(`UPDATE tournaments SET ${tParts.join(', ')} WHERE id=$${tVals.length + 1}`, [...tVals, m.tournament_id]);
      try {
        // ensure we await the points-awarding so errors bubble up and are logged
        await awardTournamentPoints(m.tournament_id);
      } catch (e) {
        console.error('awardTournamentPoints failed for tournament', m.tournament_id, e && e.message ? e.message : e);
      }
    }

    res.json({ ok: true, winner_id: winnerId });
  } catch (e) {
    console.error('Save result error:', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// List tournaments for a club (filter by status optional: 'active'|'completed')
app.get('/clubs/:clubId/tournaments', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { status } = req.query;
    let rows = await db.prepare(`
      SELECT * FROM tournaments WHERE club_id=? ORDER BY id DESC
    `).all(clubId);

    if (status === 'completed') rows = rows.filter(r => r.end_date != null);
    if (status === 'active')    rows = rows.filter(r => r.end_date == null);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Full bracket snapshot
// GET /tournaments/:id
app.get('/tournaments/:id', async (req, res) => {
  try {
    const tId = Number(req.params.id);

    const tournament = await db.prepare(`
      SELECT id, club_id, name, sport, seeds_count, end_date
      FROM tournaments
      WHERE id = ?
    `).get(tId);
    if (!tournament) return res.status(404).json({ error: 'tournament not found' });

    const players = await db.prepare(`
      SELECT
        tp.player_id AS id,
        COALESCE(p.display_name, u.display_name) AS display_name,
        tp.seed
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
    WHERE tp.tournament_id = ?
    ORDER BY (tp.seed IS NULL), tp.seed, LOWER(COALESCE(p.display_name, u.display_name))
    `).all(tId) || [];

    const matches = await db.prepare(`
      SELECT id, tournament_id, round, slot,
             p1_id, p2_id, p1_score, p2_score, winner_id,
             COALESCE(status,'scheduled') AS status
      FROM matches
      WHERE tournament_id = ?
      ORDER BY round DESC, slot ASC
    `).all(tId) || [];

    // Prefer the dedicated per-tournament results table if present.
    const hasResultsTable = await tableExists('tournament_player_points');
    const points = hasResultsTable
      ? await db.prepare(`
          SELECT tp.player_id, COALESCE(p.display_name, u.display_name) AS name, tp.points, tp.placement
            FROM tournament_player_points tp
            JOIN players p ON p.id = tp.player_id
            LEFT JOIN users u ON u.id = p.user_id
            WHERE tp.tournament_id = ?
            ORDER BY tp.points DESC, COALESCE(p.display_name, u.display_name) ASC
        `).all(tId) || []
      : (await db.prepare(`
          SELECT tp.player_id, COALESCE(p.display_name, u.display_name) AS name, tp.points, tp.placement
            FROM tournament_points tp
            JOIN players p ON p.id = tp.player_id
            LEFT JOIN users u ON u.id = p.user_id
            WHERE tp.tournament_id = ?
            ORDER BY tp.points DESC, COALESCE(p.display_name, u.display_name) ASC
        `).all(tId)) || [];

    // Normalize shapes to avoid accidental undefined/NaN values that crash the client
    const normTournament = {
      id: Number(tournament.id),
      club_id: Number(tournament.club_id),
      name: String(tournament.name || ''),
      sport: String(tournament.sport || ''),
      seeds_count: tournament.seeds_count != null ? Number(tournament.seeds_count) : null,
      end_date: tournament.end_date || null,
    };

    const normPlayers = (players || []).map(p => ({
      id: Number(p.id),
      display_name: p.display_name == null ? 'TBD' : String(p.display_name),
      seed: p.seed == null ? null : Number(p.seed)
    }));

    const normMatches = (matches || []).map(m => ({
      id: Number(m.id),
      tournament_id: Number(m.tournament_id),
      round: m.round == null ? null : Number(m.round),
      slot: m.slot == null ? null : Number(m.slot),
      p1_id: m.p1_id == null ? null : Number(m.p1_id),
      p2_id: m.p2_id == null ? null : Number(m.p2_id),
      p1_score: m.p1_score == null ? null : Number(m.p1_score),
      p2_score: m.p2_score == null ? null : Number(m.p2_score),
      winner_id: m.winner_id == null ? null : Number(m.winner_id),
      status: m.status == null ? 'scheduled' : String(m.status)
    }));

    const normPoints = (points || []).map(pt => ({
      player_id: Number(pt.player_id),
      name: pt.name == null ? '' : String(pt.name),
      points: pt.points == null ? 0 : Number(pt.points),
      placement: pt.placement == null ? null : pt.placement
    }));

    res.json({ tournament: normTournament, players: normPlayers, matches: normMatches, points: normPoints });
  } catch (e) {
    console.error('Tournament detail error:', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});



// Get standings (rankings) for a club
app.get('/clubs/:clubId/standings', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    console.log('GET /clubs/' + clubId + '/standings from', req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    const sql = `
      SELECT
        s.player_id,
        COALESCE(p.display_name, u.display_name) AS name,
        s.tournaments_played,
        s.points
      FROM standings s
      JOIN players p ON p.id = s.player_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE s.club_id = $1
      ORDER BY s.points DESC, name ASC
    `;
    const rows = await all(sql, clubId);
    console.log('  -> standings rows:', Array.isArray(rows) ? rows.length : typeof rows, Array.isArray(rows) ? rows.slice(0,5) : rows);

    res.json(rows || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Reset all standings for a club (manager only). Body: { managerId, confirm: "reset" }
app.post('/clubs/:clubId/standings/reset', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { managerId, confirm } = req.body || {};
    if (confirm !== 'reset') {
      return res.status(400).json({ error: 'type "reset" to confirm' });
    }
    const clubRow = await db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(clubId);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can reset standings' });
    }

    // You asked to have "no players there anymore" after reset
    await db.prepare(`DELETE FROM standings WHERE club_id=?`).run(clubId);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});


  // tournament → club
async function awardTournamentPoints(tournamentId) {
  const t = await get(
    `SELECT t.id, t.club_id, t.points_by_round, t.draw_size, t.seeds_count
       FROM tournaments t
      WHERE t.id = $1`,
    tournamentId
  );
  if (!t) return;

  // Idempotency guard: if this tournament already has per-tournament results
  // recorded, assume it has already been awarded and skip re-awarding. This
  // covers both the newer `tournament_player_points` table and the older
  // `tournament_points` legacy table so installations in different migration
  // states are handled safely.
  const _hasResultsTable = await tableExists('tournament_player_points');
  const _hasLegacyPoints = await tableExists('tournament_points');
  try {
    if (_hasResultsTable) {
      const row = await get(`SELECT COUNT(*) AS c FROM tournament_player_points WHERE tournament_id = $1`, tournamentId);
      if (row && Number(row.c) > 0) {
        console.log('awardTournamentPoints: results already present in tournament_player_points; skipping award for', tournamentId);
        return;
      }
    } else if (_hasLegacyPoints) {
      const row = await get(`SELECT COUNT(*) AS c FROM tournament_points WHERE tournament_id = $1`, tournamentId);
      if (row && Number(row.c) > 0) {
        console.log('awardTournamentPoints: results already present in tournament_points (legacy); skipping award for', tournamentId);
        return;
      }
    }
  } catch (e) {
    console.warn('awardTournamentPoints idempotency check failed, continuing with award:', e && e.message ? e.message : e);
  }

  const matches = await all(
    `SELECT id, round, slot, p1_id, p2_id, winner_id
       FROM matches
      WHERE tournament_id = $1
        AND winner_id IS NOT NULL`,
    tournamentId
  );
  if (!matches.length) return;

  const final = matches.find(x => Number(x.round) === 1);
  const championId = final?.winner_id ? Number(final.winner_id) : null;

  // Default points mapping (labels -> points)
  const DEFAULT_POINTS = { R128:0, R64:5, R32:10, R16:20, QF:40, SF:70, F:120, C:200 };

  // Determine per-tournament points config (from tournaments.points_by_round JSON), fallback to DEFAULT_POINTS
  let ptsCfg = {};
  try {
    ptsCfg = t.points_by_round ? JSON.parse(t.points_by_round) : {};
  } catch (e) {
    ptsCfg = {};
  }

  // Helper to get point value for a label
  const pointsFor = (label) => {
    if (ptsCfg && typeof ptsCfg[label] !== 'undefined' && ptsCfg[label] !== null) return Number(ptsCfg[label]);
    return Number(DEFAULT_POINTS[label] || 0);
  };

  // Determine draw size. Use stored draw_size if present, else infer from matches (max round -> drawSize = 2^maxRound)
  const maxRound = matches.length ? Math.max(...matches.map(m => Number(m.round) || 0)) : 0;
  const drawSize = Number(t.draw_size) || Number(t.seeds_count) || (maxRound ? Math.pow(2, maxRound) : 0);

  // Build round labels (same logic as client)
  const roundLabelsFor = (sz) => {
    const map = [
      { label: 'R128', size: 128 }, { label: 'R64', size: 64 }, { label: 'R32', size: 32 },
      { label: 'R16', size: 16 }, { label: 'QF', size: 8 }, { label: 'SF', size: 4 },
      { label: 'F', size: 2 }, { label: 'C', size: 1 }
    ];
    return map.filter(x => x.size <= sz).map(x => x.label);
  };

  const labels = drawSize ? roundLabelsFor(drawSize) : [];
  // labels includes the champion label as last element; losers correspond to labels.slice(0,-1)
  const loserLabels = labels.slice(0, -1);

  const agg = new Map(); // player_id -> { played, points }
  const add = (pid, pts = 0) => {
    if (!pid) return;
    const cur = agg.get(pid) || { played: 0, points: 0 };
    cur.played = 1;
    cur.points += Number(pts || 0);
    agg.set(pid, cur);
  };

  for (const m of matches) {
    add(m.p1_id, 0);
    add(m.p2_id, 0);
    const loser = Number(m.winner_id) === Number(m.p1_id) ? m.p2_id : m.p1_id;
    // Map m.round to a label in loserLabels. If we can't map, fall back to 0.
    let pts = 0;
    if (Number(m.round) && loserLabels.length) {
      const idx = (maxRound - Number(m.round));
      if (idx >= 0 && idx < loserLabels.length) {
        const lbl = loserLabels[idx];
        pts = pointsFor(lbl);
      }
    }
    add(loser, pts || 0);
  }
  if (championId) add(championId, pointsFor('C'));

  // Prefer writing per-player results into `tournament_player_points` (newer
  // semantic). If that table is not present, fall back to the older
  // `tournament_points` table shape that some installs used (but that table
  // can also mean a per-tournament config of points by round). This makes the
  // behavior robust across migrations.
  const hasResultsTable = _hasResultsTable; // computed above (idempotency check)

  await run('BEGIN');
  try {
    for (const [playerId, v] of agg.entries()) {
      if (hasResultsTable) {
        await run(
          `INSERT INTO tournament_player_points (tournament_id, player_id, points, placement)
           VALUES ($1, $2, $3, NULL)
           ON CONFLICT (tournament_id, player_id)
           DO UPDATE SET points = tournament_player_points.points + EXCLUDED.points`,
          tournamentId, playerId, v.points
        );
      } else {
        // legacy fallback
        await run(
          `INSERT INTO tournament_points (tournament_id, player_id, points, placement)
           VALUES ($1, $2, $3, NULL)
           ON CONFLICT (tournament_id, player_id)
           DO UPDATE SET points = tournament_points.points + EXCLUDED.points`,
          tournamentId, playerId, v.points
        );
      }

      // Update club standings (upsert incrementally)
      await run(
        `INSERT INTO standings (club_id, player_id, tournaments_played, points)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (club_id, player_id)
         DO UPDATE SET
           tournaments_played = standings.tournaments_played + EXCLUDED.tournaments_played,
           points             = standings.points + EXCLUDED.points`,
        t.club_id, playerId, v.played, v.points
      );
    }
    await run('COMMIT');
  } catch (e) {
    await run('ROLLBACK');
    throw e;
  }
}

app.get('/tournaments/:id/joined', async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ joined: false });

    const t = await db.prepare(`SELECT id, club_id FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    // find or create the player's club profile
    // Ensure we await the DB calls - missing awaits cause Promises (truthy)
    // which made the endpoint always return joined: true.
    let player = await db.prepare(`SELECT id FROM players WHERE club_id=? AND user_id=?`)
      .get(t.club_id, userId);

    if (!player) return res.json({ joined: false });

    const row = await db.prepare(`
      SELECT 1 FROM tournament_players WHERE tournament_id=? AND player_id=? LIMIT 1
    `).get(tId, player.id);

    res.json({ joined: !!row });
  } catch (e) {
    console.error('joined error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// POST /tournaments/:id/register - Self-register (authenticated user)
app.post('/tournaments/:id/register', authenticateToken, async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const userId = req.user.id; // Get from JWT token, not request body

    const t = await db.prepare(`SELECT id, club_id, end_date FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const hasMatches = await db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE tournament_id=?`).get(tId).c > 0;
    if (hasMatches) return res.status(400).json({ error: 'sign-ups are closed (draw already generated)' });
    if (t.end_date) return res.status(400).json({ error: 'tournament is completed' });

    // find or create player profile in this club
    let player = await db.prepare(`SELECT id FROM players WHERE club_id=? AND user_id=?`)
      .get(t.club_id, Number(userId));
    if (!player) {
      const u = await db.prepare(`SELECT display_name FROM users WHERE id=?`).get(Number(userId));
      const pCols = new Set((await tableInfo('players')).map(c => c.name));
      const ins = pCols.has('display_name')
        ? db.prepare(`INSERT INTO players (club_id, user_id, display_name) VALUES (?, ?, ?) RETURNING id`)
        : db.prepare(`INSERT INTO players (club_id, user_id) VALUES (?, ?) RETURNING id`);

      const result = pCols.has('display_name')
        ? await ins.get(t.club_id, Number(userId), u?.display_name ?? `user${userId}`)
        : await ins.get(t.club_id, Number(userId));
      player = { id: Number(result.id) };
    }

    await db.prepare(`
      INSERT INTO tournament_players (tournament_id, player_id)
      VALUES (?, ?)
      ON CONFLICT (tournament_id, player_id) DO NOTHING
    `).run(tId, player.id);

    // add to standings
    await db.prepare(`
      INSERT INTO standings (club_id, player_id, tournaments_played, points)
      VALUES (?, ?, 0, 0)
      ON CONFLICT (club_id, player_id) DO NOTHING
    `).run(t.club_id, player.id);

    res.json({ ok: true });
  } catch (e) {
    console.error('register error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// DELETE /tournaments/:id/register - Self-withdraw (authenticated user)
app.delete('/tournaments/:id/register', authenticateToken, async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const userId = req.user.id; // Get from JWT token, not request body

    const t = await db.prepare(`SELECT id, club_id FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const hasMatches = await db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE tournament_id=?`).get(tId).c > 0;
    if (hasMatches) return res.status(400).json({ error: 'cannot withdraw (draw already generated)' });

    const player = await db.prepare(`SELECT id FROM players WHERE club_id=? AND user_id=?`)
      .get(t.club_id, Number(userId));
    if (!player) return res.json({ ok: true }); // nothing to do

    db.prepare(`DELETE FROM tournament_players WHERE tournament_id=? AND player_id=?`)
      .run(tId, player.id);

    res.json({ ok: true });
  } catch (e) {
    console.error('withdraw error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// after you've built `slots` with some empty holes (0 or null = BYE):
async function autoAdvanceByes(tId) {
  console.log(`[autoAdvanceByes] Processing tournament ${tId} - ONE HOP ONLY`);
  
  const hasStatus = new Set((await tableInfo('matches')).map(c => c.name)).has('status');
  const updSQL = hasStatus
    ? `UPDATE matches SET winner_id=?, status='completed' WHERE id=?`
    : `UPDATE matches SET winner_id=? WHERE id=?`;

  // Get all matches for this tournament, starting from the highest round (first round)
  const ms = await db.prepare(`SELECT id, round, slot, p1_id, p2_id, winner_id FROM matches WHERE tournament_id=? ORDER BY round DESC, slot ASC`).all(tId);
  
  console.log(`[autoAdvanceByes] Found ${ms.length} matches`);
  
  // Process matches in current round only - NO cascading across rounds
  const processedThisPass = new Set();
  
  for (const m of ms) {
    // Skip if already processed or already has a winner
    if (processedThisPass.has(m.id) || m.winner_id) continue;
    
    const byeP1 = !m.p1_id;
    const byeP2 = !m.p2_id;
    
    // Exactly one is bye - advance the other player ONE HOP only
    if (byeP1 ^ byeP2) {
      const winner = m.p1_id || m.p2_id;
      console.log(`[autoAdvanceByes] Advancing player ${winner} from R${m.round}S${m.slot} (true bye)`);
      
      // Mark this match as completed
      await db.prepare(updSQL).run(winner, m.id);
      processedThisPass.add(m.id);
      
      // Advance to next round - ONE HOP ONLY
      const nextRound = m.round - 1;
      if (nextRound >= 1) {
        const nextSlot = Math.floor(m.slot / 2);
        
        // Find or create the next round match
        let next = await db.prepare(`SELECT id, p1_id, p2_id FROM matches WHERE tournament_id=? AND round=? AND slot=?`)
          .get(tId, nextRound, nextSlot);
          
        if (!next) {
          // Create the next round match
          const ins = hasStatus
            ? `INSERT INTO matches (tournament_id,round,slot,p1_id,p2_id,p1_score,p2_score,winner_id,status)
               VALUES (?,?,?,?,?,NULL,NULL,NULL,'scheduled')`
            : `INSERT INTO matches (tournament_id,round,slot,p1_id,p2_id,p1_score,p2_score,winner_id)
               VALUES (?,?,?,?,?,NULL,NULL,NULL)`;
          await db.prepare(ins).run(tId, nextRound, nextSlot, null, null);
          next = await db.prepare(`SELECT id, p1_id, p2_id FROM matches WHERE tournament_id=? AND round=? AND slot=?`)
            .get(tId, nextRound, nextSlot);
        }
        
        // Place winner in correct position - but DO NOT auto-complete the next match
        const field = (m.slot % 2 === 0) ? 'p1_id' : 'p2_id';
        if (next && next[field] == null) {
          await db.prepare(`UPDATE matches SET ${field}=? WHERE id=?`).run(winner, next.id);
          console.log(`[autoAdvanceByes] Placed player ${winner} in R${nextRound}S${nextSlot} ${field}`);
        }
      }
    }
  }
  
  console.log(`[autoAdvanceByes] Completed - processed ${processedThisPass.size} bye matches`);
}


// DELETE /tournaments/:id/players/:playerId?managerId=999
app.delete('/tournaments/:id/players/:playerId', async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const playerId = Number(req.params.playerId);
    const managerId = Number(req.query.managerId);

    const t = await db.prepare(`SELECT id, club_id FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });
    const clubRow = await db.prepare(`SELECT manager_id FROM clubs WHERE id=?`).get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== managerId) {
      return res.status(403).json({ error: 'only club manager can modify entrants' });
    }

    const hasMatches = await db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE tournament_id=?`).get(tId).c > 0;
    if (hasMatches) return res.status(400).json({ error: 'cannot remove after draw is generated' });

    await db.prepare(`DELETE FROM tournament_players WHERE tournament_id=? AND player_id=?`).run(tId, playerId);
    res.json({ ok: true });
  } catch (e) {
    console.error('remove entrant error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// DELETE /tournaments/:id?managerId=123
app.delete('/tournaments/:id', async (req, res) => {
  try {
    const tId = Number(req.params.id);
    const managerId = Number(req.query.managerId);
    const t = await db.prepare(`SELECT id, club_id, name FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const clubRow = await db.prepare(`SELECT manager_id FROM clubs WHERE id=?`).get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== managerId) {
      return res.status(403).json({ error: 'only club manager can delete tournaments' });
    }

    deleteTournamentById(tId);
    res.json({ ok: true, deleted: 1, ids: [tId] });
  } catch (e) {
    console.error('delete tournament error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// DELETE /clubs/:clubId/tournaments?status=active|completed|all&managerId=123
app.delete('/clubs/:clubId/tournaments', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const status = String(req.query.status || 'all').toLowerCase();
    const managerId = Number(req.query.managerId);

    const clubRow = await db.prepare(`SELECT manager_id FROM clubs WHERE id=?`).get(clubId);
    if (!clubRow || Number(clubRow.manager_id) !== managerId) {
      return res.status(403).json({ error: 'only club manager can delete tournaments' });
    }

    let where = `club_id = ?`;
    if (status === 'active') where += ` AND end_date IS NULL`;
    else if (status === 'completed') where += ` AND end_date IS NOT NULL`;
    // 'all' = no extra filter

    const ids = await db.prepare(`SELECT id FROM tournaments WHERE ${where}`).all(clubId).map(r => r.id);
    if (ids.length === 0) return res.json({ ok: true, deleted: 0, ids: [] });

    // sequentially delete tournaments (deleteTournamentById handles its own DB calls)
    for (const id of ids) {
      // do not await in parallel to avoid overwhelming the DB with deletes
      // each call performs the necessary child deletions
      // await so errors can be caught and aborted
      await deleteTournamentById(id);
    }

    res.json({ ok: true, deleted: ids.length, ids });
  } catch (e) {
    console.error('bulk delete tournaments error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Clubs & Membership
// -------------------------------
// Helper: generate a short unique club code
function makeClubCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Ensure the given club has a non-null unique code. Tries several times on conflict.
async function ensureClubHasCode(clubId) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeClubCode();
    try {
      // Try to set the code only if it's still null to avoid races
      const r = await pool.query(
        `UPDATE clubs SET code = $1 WHERE id = $2 AND (code IS NULL OR code = '') RETURNING code`,
        [code, clubId]
      );
      if (r.rows && r.rows.length) return r.rows[0].code;
      // if no rows returned, maybe another process set the code; fetch it
      const got = await pool.query('SELECT code FROM clubs WHERE id = $1', [clubId]);
      if (got.rows && got.rows[0] && got.rows[0].code) return got.rows[0].code;
      // otherwise loop to try a new code
    } catch (e) {
      // Unique violation or other DB race -> try again
      if (String(e.code) === '23505') continue;
      // If unexpected error, break and rethrow
      console.error('ensureClubHasCode error', e && e.message ? e.message : e);
      throw e;
    }
  }
  throw new Error('could not generate unique club code');
}
// Create a club
app.post('/clubs', async (req, res) => {
  try {
    // accept either { managerId } or { userId } from the client
    const { name, managerId: mid, userId, timezone } = req.body || {};
    const managerId = Number(mid ?? userId);

    if (!name || !managerId) {
      return res.status(400).json({ error: 'name and managerId (or userId) required' });
    }

    // make sure clubs has the columns we need (idempotent)
    await pool.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS code TEXT UNIQUE`);
    await pool.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'tennis'`);
    await pool.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS manager_id BIGINT`);
    await pool.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS timezone TEXT`);

    // promote user to manager (idempotent)
    await pool.query(`UPDATE users SET role='manager', is_manager=true WHERE id=$1`, [managerId]);

    // create a unique code and insert the club
    const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
    let club = null;
    let code = genCode();

    for (let i = 0; i < 6; i++) {
      const tryInsert = await pool.query(
        `INSERT INTO clubs (name, sport, manager_id, code, timezone)
         VALUES ($1, 'tennis', $2, $3, $4)
         ON CONFLICT (code) DO NOTHING
         RETURNING id, name, sport, manager_id, code, timezone`,
        [name, managerId, code, timezone || null]
      );
      if (tryInsert.rows.length) {
        club = tryInsert.rows[0];
        break;
      }
      code = genCode();
    }

    if (!club) return res.status(500).json({ error: 'could not generate unique club code' });

    // ensure the manager link exists
    await pool.query(
      `INSERT INTO user_clubs (user_id, club_id, role)
       VALUES ($1, $2, 'manager')
       ON CONFLICT DO NOTHING`,
      [managerId, club.id]
    );

    return res.status(201).json(club);
  } catch (e) {
    console.error('POST /clubs', e);
    return res.status(500).json({ error: 'unexpected error' });
  }
});

// Lightweight lookup for client-side convenience: resolve a short name to a user id
// Query: /users/lookup?name=alice
app.get('/users/lookup', async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const uCols = (await tableInfo('users')).map(c => c.name);
    const where = [];
    const params = [];
    
    // Build separate parameters for each searchable column
    if (uCols.includes('username')) { 
      where.push(`LOWER(username)=LOWER($${params.length + 1})`); 
      params.push(name); 
    }
    if (uCols.includes('display_name')) { 
      where.push(`LOWER(display_name)=LOWER($${params.length + 1})`); 
      params.push(name); 
    }
    if (uCols.includes('email')) { 
      where.push(`LOWER(email)=LOWER($${params.length + 1})`); 
      params.push(name); 
    }

    if (!where.length) return res.status(500).json({ error: 'users table missing searchable columns' });

    // Use DISTINCT to avoid duplicate rows when multiple columns match the same row
    const sql = `SELECT DISTINCT id, display_name, username, email FROM users WHERE ${where.join(' OR ')}`;
    const rows = (await pool.query(sql, params)).rows || [];
    
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    if (rows.length > 1) return res.status(300).json({ error: 'ambiguous', candidates: rows.map(r => ({ id: r.id, display_name: r.display_name, username: r.username, email: r.email })) });
    
    const r = rows[0];
    res.json({ id: r.id, display_name: r.display_name, username: r.username, email: r.email });
  } catch (e) {
    console.error('GET /users/lookup', e && e.message ? e.message : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, role, is_manager, email_verified_at
       FROM users WHERE id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('GET /users/:id', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});



app.post('/clubs/join', async (req, res) => {
  try {
    const { code, userId } = req.body || {};
    if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });

    const c = await pool.query(
      `SELECT id, name, sport, manager_id, code, auto_approve_join
         FROM clubs
        WHERE code=$1`,
      [code.trim().toUpperCase()]
    );
    if (!c.rows.length) return res.status(404).json({ error: 'invalid code' });

    const club = c.rows[0];
    
    // Check if user is already a member
    const existingMember = await pool.query(
      `SELECT 1 FROM user_clubs WHERE user_id = $1 AND club_id = $2`,
      [userId, club.id]
    );
    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'already a member of this club' });
    }

    // Check if user already has a pending request
    const existingRequest = await pool.query(
      `SELECT 1 FROM club_join_requests WHERE user_id = $1 AND club_id = $2 AND status = 'pending'`,
      [userId, club.id]
    );
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'request already pending' });
    }

    if (club.auto_approve_join) {
      // Auto-approve: directly add to user_clubs
      await pool.query(
        `INSERT INTO user_clubs (user_id, club_id, role)
         VALUES ($1, $2, 'player')`,
        [userId, club.id]
      );
      res.json({ club, status: 'approved' });
    } else {
      // Create a join request for manager approval
      await pool.query(
        `INSERT INTO club_join_requests (user_id, club_id, status, created_at)
         VALUES ($1, $2, 'pending', NOW())`,
        [userId, club.id]
      );
      res.json({ club, status: 'pending' });
    }
  } catch (e) {
    console.error('POST /clubs/join', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.get('/users/:id/club', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `WITH all_clubs AS (
         SELECT c.id, c.name, c.sport, c.manager_id, c.code, c.timezone
           FROM clubs c
          WHERE c.manager_id = $1
         UNION
         SELECT c.id, c.name, c.sport, c.manager_id, c.code, c.timezone
           FROM user_clubs uc
           JOIN clubs c ON c.id = uc.club_id
          WHERE uc.user_id = $1
       )
       SELECT * FROM all_clubs
       ORDER BY id
       LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'no club' });

    const club = rows[0];
    if (!club.code) {
      try {
        const newCode = await ensureClubHasCode(club.id);
        club.code = newCode;
      } catch (e) {
        console.error('Failed to ensure club code for', club.id, e && e.message ? e.message : e);
      }
    }

    res.json(club);
  } catch (e) {
    console.error('GET /users/:id/club', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// GET /users/:id/clubs  (plural)
app.get('/users/:id/clubs', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('GET /users/:id/clubs - user id:', id);
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Let's test which database we're connected to
    try {
      const dbTest = await pool.query('SELECT current_database() as db, version() as version');
      console.log('Database info:', dbTest.rows[0]);
    } catch (e) {
      console.log('Failed to get database info via pool:', e.message);
    }
    
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.sport, c.manager_id, c.code, c.timezone, c.auto_approve_join
         FROM clubs c
        WHERE c.manager_id = $1
        UNION
       SELECT c.id, c.name, c.sport, c.manager_id, c.code, c.timezone, c.auto_approve_join
         FROM user_clubs uc
         JOIN clubs c ON c.id = uc.club_id
        WHERE uc.user_id = $1
        ORDER BY id`,
      [id]
    );
    console.log('GET /users/:id/clubs - raw rows:', rows.length, rows);

    // Backfill any missing codes so the client always receives a code value
    for (const r of rows) {
      if (!r.code) {
        try {
          const newCode = await ensureClubHasCode(r.id);
          r.code = newCode;
        } catch (e) {
          console.error('Failed to ensure club code for', r.id, e && e.message ? e.message : e);
        }
      }
    }
    console.log('GET /users/:id/clubs - final result:', rows);

    res.json(rows); // [] if none
  } catch (e) {
    console.error('GET /users/:id/clubs', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});
// -------------------------------
// Club Sports CRUD
// -------------------------------
app.get('/clubs/:clubId/sports', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    // If the table hasn't been created yet (fresh DB/migration state), return an empty list
    if (!(await tableExists('club_sports'))) return res.json([]);

    // Prefer ordering by id, but some installs may have created the table without an id column.
    // Try the id-based ordering first, and fall back to ordering by sport if the id column is absent.
    let rows;
    try {
      rows = await db.prepare('SELECT * FROM club_sports WHERE club_id = ? ORDER BY id').all(clubId);
    } catch (err) {
      // column "id" does not exist (Postgres 42703) -> fallback to ordering by sport
      if ((err && String(err.code) === '42703') || /column \"id\" does not exist/.test(String(err.message || ''))) {
        rows = await db.prepare('SELECT * FROM club_sports WHERE club_id = ? ORDER BY sport ASC').all(clubId);
      } else {
        throw err;
      }
    }

    res.json(rows);
  } catch (e) {
    console.error('GET /clubs/:clubId/sports', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Type-safe: owner OR explicit user_clubs manager
async function isClubManager(userId, clubId) {
  const uid = Number(userId);
  const cid = Number(clubId);
  if (!uid || !cid) return false;

  // ONE query -> boolean; avoids bigint vs number issues entirely
  const { rows } = await pool.query(
    `SELECT
       EXISTS (SELECT 1 FROM clubs      WHERE id = $1 AND manager_id = $2)
       OR
       EXISTS (SELECT 1 FROM user_clubs WHERE club_id = $1 AND user_id = $2 AND role = 'manager')
       AS ok`,
    [cid, uid]
  );

  const ok = !!rows[0]?.ok;
  console.log('isClubManager?', { clubId: cid, userId: uid, ok });
  return ok;
}

// -------------------------------
// Announcements & push subscriptions
// -------------------------------

// Create an announcement (manager only)
app.post('/announcements', async (req, res) => {
  try {
    const { clubId, managerId, title, body, sendPush } = req.body || {};
    if (!clubId || !managerId || !title || !body) return res.status(400).json({ error: 'clubId, managerId, title, body required' });

    const ok = await isClubManager(managerId, clubId);
    if (!ok) return res.status(403).json({ error: 'not authorized' });

    const insert = await pool.query(
      `INSERT INTO announcements (club_id, manager_id, title, body, send_push) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
      [clubId, managerId, title, body, !!sendPush]
    );
    const id = insert.rows[0].id;

    // For now, create user_announcements rows for all users in the club (simple approach)
    // Fetch members (manager + user_clubs members)
    const members = (await pool.query(`SELECT id FROM users WHERE id = $1 UNION SELECT user_id AS id FROM user_clubs WHERE club_id = $2`, [managerId, clubId])).rows;
    for (const m of members) {
      try {
        await pool.query('INSERT INTO user_announcements (announcement_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, m.id]);
      } catch (e) {
        // ignore individual insert errors
      }
    }

    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error('POST /announcements', e && e.stack ? e.stack : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Register a web-push subscription for the current user
app.post('/push-subscriptions', async (req, res) => {
  try {
    const { userId, endpoint, p256dh, auth } = req.body || {};
    if (!userId || !endpoint) return res.status(400).json({ error: 'userId and endpoint required' });

    await pool.query(`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1,$2,$3,$4) ON CONFLICT (endpoint) DO UPDATE SET user_id=EXCLUDED.user_id, p256dh=EXCLUDED.p256dh, auth=EXCLUDED.auth`, [userId, endpoint, p256dh || null, auth || null]);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /push-subscriptions', e && e.stack ? e.stack : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// List announcements for a club (public list)
app.get('/clubs/:clubId/announcements', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { rows } = await pool.query('SELECT a.id, a.title, a.body, a.send_push, a.created_at, u.id as manager_id, u.display_name as manager_name FROM announcements a JOIN users u ON u.id = a.manager_id WHERE a.club_id=$1 ORDER BY a.created_at DESC', [clubId]);
    res.json(rows);
  } catch (e) {
    console.error('GET /clubs/:clubId/announcements', e && e.stack ? e.stack : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// List announcements for a user (with read state)
app.get('/users/:userId/announcements', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { rows } = await pool.query(`SELECT ua.id as ua_id, ua.read, ua.read_at, a.id as announcement_id, a.title, a.body, a.created_at, a.send_push FROM user_announcements ua JOIN announcements a ON a.id = ua.announcement_id WHERE ua.user_id=$1 ORDER BY a.created_at DESC`, [userId]);
    res.json(rows);
  } catch (e) {
    console.error('GET /users/:userId/announcements', e && e.stack ? e.stack : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Mark an announcement as read for a user
app.post('/users/:userId/announcements/:announcementId/read', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const announcementId = Number(req.params.announcementId);
    await pool.query('UPDATE user_announcements SET read = TRUE, read_at = now() WHERE user_id=$1 AND announcement_id=$2', [userId, announcementId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /users/:userId/announcements/:announcementId/read', e && e.stack ? e.stack : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});


app.post('/clubs/:clubId/sports', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { userId, sport, courts, openHour, closeHour, slotMinutes } = req.body || {};
    if (!userId || !sport) return res.status(400).json({ error: 'userId and sport are required' });

    const ok = await isClubManager(userId, clubId);
    if (!ok) return res.status(403).json({ error: 'only club manager can modify sports' });

    // Ensure table + columns exist (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_sports(
        club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        sport   TEXT   NOT NULL
      )`);
    // Ensure there is an 'id' primary key column (some migrations may have omitted it)
    await pool.query(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='club_sports' AND column_name='id') THEN
        ALTER TABLE club_sports ADD COLUMN id BIGSERIAL PRIMARY KEY;
      END IF;
    END$$;`);
    await pool.query(`ALTER TABLE club_sports ADD COLUMN IF NOT EXISTS courts INT`);
    await pool.query(`ALTER TABLE club_sports ADD COLUMN IF NOT EXISTS open_hour INT`);
    await pool.query(`ALTER TABLE club_sports ADD COLUMN IF NOT EXISTS close_hour INT`);
    await pool.query(`ALTER TABLE club_sports ADD COLUMN IF NOT EXISTS slot_minutes INT`);
    // Ensure the unique key matches our ON CONFLICT
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
           WHERE tablename='club_sports'
             AND indexname='club_sports_club_id_sport_key'
        ) THEN
          -- create a unique index on (club_id, sport) if it's missing
          CREATE UNIQUE INDEX club_sports_club_id_sport_key
            ON club_sports (club_id, sport);
        END IF;
      END$$;`);

    const s  = String(sport).toLowerCase();
    const cs = Number(courts);
    const oh = Number(openHour);
    const ch = Number(closeHour);
    const sm = Number(slotMinutes);

    await pool.query(
      `INSERT INTO club_sports (club_id, sport, courts, open_hour, close_hour, slot_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (club_id, sport) DO UPDATE
         SET courts=EXCLUDED.courts,
             open_hour=EXCLUDED.open_hour,
             close_hour=EXCLUDED.close_hour,
             slot_minutes=EXCLUDED.slot_minutes`,
      [clubId, s, cs, oh, ch, sm]
    );

    // If the manager requested a number of courts, create missing `courts` rows
    // for this club so legacy booking code that maps a zero-based courtIndex
    // to a real courts.id will succeed. This is idempotent: we only insert the
    // delta between existing rows and the requested count.
    try {
      const requested = Number(cs) || 0;
      if (requested > 0) {
        // Ensure courts table has a sport column so we can create sport-scoped courts
        await pool.query(`ALTER TABLE courts ADD COLUMN IF NOT EXISTS sport TEXT`);

        // Determine this club's default sport (some installs store a default sport on clubs)
        const clubSportRow = await pool.query('SELECT sport FROM clubs WHERE id=$1', [clubId]);
        const clubDefaultSport = clubSportRow.rows?.[0] ? String(clubSportRow.rows[0].sport || '').toLowerCase() : '';

        const requestedSport = String(s).toLowerCase();

        // Count existing courts for this club scoped to the requested sport. For the
        // club's default sport, also include courts where sport IS NULL (legacy rows).
        let existingCountRes;
        if (requestedSport === clubDefaultSport) {
          existingCountRes = await pool.query(
            "SELECT COUNT(*)::int AS c FROM courts WHERE club_id=$1 AND (sport = $2 OR sport IS NULL)",
            [clubId, requestedSport]
          );
        } else {
          existingCountRes = await pool.query(
            "SELECT COUNT(*)::int AS c FROM courts WHERE club_id=$1 AND sport = $2",
            [clubId, requestedSport]
          );
        }
        const existing = existingCountRes.rows?.[0] ? Number(existingCountRes.rows[0].c) : 0;
        if (existing < requested) {
          console.log('Creating', requested - existing, 'missing courts for club', clubId, 'sport', requestedSport);
          for (let i = existing + 1; i <= requested; i++) {
            // label courts as "<sport> Court 1", "<sport> Court 2", ...
            await pool.query('INSERT INTO courts (club_id, label, sport) VALUES ($1, $2, $3)', [clubId, `${requestedSport} Court ${i}`, requestedSport]);
          }
        }
      }
    } catch (e) {
      console.error('Could not ensure courts rows for club', clubId, e && e.message ? e.message : e);
    }
    console.log('POST /clubs/:id/sports payload', {
      clubId,
      userId,
      sport,
      courts,
      openHour,
      closeHour,
      slotMinutes
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('POST /clubs/:clubId/sports ->', e.code || '', e.message);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Allow club manager to update the club timezone
app.put('/clubs/:clubId/timezone', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { managerId, timezone } = req.body || {};
    if (!clubId || !timezone) return res.status(400).json({ error: 'clubId and timezone required' });

    const mid = Number(managerId || req.body.userId || req.query.managerId || req.query.userId);
    if (!mid) return res.status(400).json({ error: 'managerId or userId required' });

    const ok = await isClubManager(mid, clubId);
    if (!ok) return res.status(403).json({ error: 'only club manager can update club timezone' });

    await pool.query('ALTER TABLE clubs ADD COLUMN IF NOT EXISTS timezone TEXT');
    await pool.query('UPDATE clubs SET timezone=$1 WHERE id=$2', [timezone, clubId]);
    const { rows } = await pool.query('SELECT id, name, sport, manager_id, code, timezone FROM clubs WHERE id=$1', [clubId]);
    if (!rows.length) return res.status(404).json({ error: 'club not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('PUT /clubs/:clubId/timezone', e && e.message ? e.message : e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.put('/clubs/:clubId/sports/:id', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const id = Number(req.params.id);
    const { sport, courts, openHour, closeHour, slotMinutes } = req.body || {};
    // Accept managerId or userId from body OR query (some clients send via query)
    const managerIdProvided = Number(
      (req.body && (req.body.managerId ?? req.body.userId))
      ?? (req.query && (req.query.managerId ?? req.query.userId))
      ?? null
    );

    console.debug('PUT /clubs/:clubId/sports/:id auth check', { clubId, id, managerIdProvided, body: req.body, query: req.query });
    if (!managerIdProvided) return res.status(400).json({ error: 'managerId or userId required' });
    const ok = await isClubManager(managerIdProvided, clubId);
    console.debug('isClubManager result', { ok });
    if (!ok) return res.status(403).json({ error: 'only club manager can modify sports' });

    db.prepare(`
      UPDATE club_sports
      SET sport = ?, courts = ?, open_hour = ?, close_hour = ?, slot_minutes = ?
      WHERE id = ? AND club_id = ?
    `).run(String(sport), Number(courts), Number(openHour), Number(closeHour), Number(slotMinutes), id, clubId);

    const updated = await db.prepare('SELECT * FROM club_sports WHERE id = ?').get(id);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.delete('/clubs/:clubId/sports/:id', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const id = Number(req.params.id);
    // Accept managerId or userId from body OR query (some clients send via query)
    const managerIdProvided = Number(
      (req.body && (req.body.managerId ?? req.body.userId))
      ?? (req.query && (req.query.managerId ?? req.query.userId))
      ?? null
    );
    console.debug('DELETE /clubs/:clubId/sports/:id auth check', { clubId, id, managerIdProvided, body: req.body, query: req.query });
    if (!managerIdProvided) return res.status(400).json({ error: 'managerId or userId required' });
    const ok = await isClubManager(managerIdProvided, clubId);
    console.debug('isClubManager result', { ok });
    if (!ok) return res.status(403).json({ error: 'only club manager can delete sports' });

    await db.prepare('DELETE FROM club_sports WHERE id = ? AND club_id = ?').run(id, clubId);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// ===== CLUB MANAGEMENT: REQUESTS & INVITATIONS =====

// Helper function to ensure user is manager of the club
async function ensureManager(userId, clubId) {
  const club = await db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
  if (!club) return false;
  return Number(club.manager_id) === Number(userId);
}

// Helper function to add a member to a club
async function addMember(clubId, userId) {
  try {
    // Upsert into user_clubs (using the existing table)
    await pool.query(`
      INSERT INTO user_clubs (club_id, user_id, role) 
      VALUES ($1, $2, 'player')
      ON CONFLICT (club_id, user_id) DO NOTHING
    `, [clubId, userId]);
    
    // Delete any pending requests/invites
    await pool.query('DELETE FROM club_join_requests WHERE club_id = $1 AND user_id = $2', [clubId, userId]);
    await pool.query('DELETE FROM club_invitations WHERE club_id = $1 AND invited_user_id = $2', [clubId, userId]);
    
    return true;
  } catch (e) {
    console.error('addMember error:', e);
    return false;
  }
}

// MANAGER: Get join requests for a club
app.get('/clubs/:clubId/requests', authenticateToken, async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const isManager = await ensureManager(userId, clubId);
    if (!isManager) return res.status(403).json({ error: 'only club managers can view requests' });
    
    const requests = await pool.query(`
      SELECT cjr.id, cjr.status, cjr.created_at, 
             COALESCE(u.display_name, u.username, u.email) as username
      FROM club_join_requests cjr
      JOIN users u ON cjr.user_id = u.id
      WHERE cjr.club_id = $1
      ORDER BY cjr.created_at DESC
    `, [clubId]);
    
    const grouped = {
      pending: requests.rows.filter(r => r.status === 'pending'),
      accepted: requests.rows.filter(r => r.status === 'accepted'),
      declined: requests.rows.filter(r => r.status === 'declined')
    };
    
    res.json(grouped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// MANAGER: Accept/decline a join request
app.patch('/clubs/:clubId/requests/:requestId', authenticateToken, express.json(), async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const requestId = Number(req.params.requestId);
    const { action } = req.body;
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or decline' });
    }
    
    const isManager = await ensureManager(userId, clubId);
    if (!isManager) return res.status(403).json({ error: 'only club managers can manage requests' });
    
    // Get the request
    const request = await pool.query(`
      SELECT user_id FROM club_join_requests 
      WHERE id = $1 AND club_id = $2 AND status = 'pending'
    `, [requestId, clubId]);
    
    if (!request.rows.length) return res.status(404).json({ error: 'request not found or already processed' });
    
    if (action === 'accept') {
      await addMember(clubId, request.rows[0].user_id);
      await pool.query(`
        UPDATE club_join_requests 
        SET status = 'accepted' 
        WHERE id = $1
      `, [requestId]);
    } else {
      await pool.query(`
        UPDATE club_join_requests 
        SET status = 'declined' 
        WHERE id = $1
      `, [requestId]);
    }
    
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// MANAGER: Toggle auto-approve setting
app.patch('/clubs/:clubId/auto-approve', authenticateToken, express.json(), async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { enabled } = req.body;
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const isManager = await ensureManager(userId, clubId);
    if (!isManager) return res.status(403).json({ error: 'only club managers can change settings' });
    
    await pool.query(`
      UPDATE clubs 
      SET auto_approve_join = $1 
      WHERE id = $2
    `, [enabled, clubId]);
    
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// MANAGER: Get club members
app.get('/clubs/:clubId/members', authenticateToken, async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const isManager = await ensureManager(userId, clubId);
    if (!isManager) return res.status(403).json({ error: 'only club managers can view members' });
    
    const members = await pool.query(`
      SELECT uc.user_id, uc.role, 
             COALESCE(u.display_name, u.username, u.email) as username
      FROM user_clubs uc
      JOIN users u ON uc.user_id = u.id
      WHERE uc.club_id = $1
      ORDER BY uc.role DESC, COALESCE(u.display_name, u.username, u.email) ASC
    `, [clubId]);

    res.json(members.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Get club members (for any club member, read-only)
app.get('/clubs/:clubId/people', authenticateToken, async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    // Check if user is a member of this club (either manager or regular member)
    const membershipCheck = await pool.query(`
      SELECT 1 FROM user_clubs WHERE club_id = $1 AND user_id = $2
      UNION
      SELECT 1 FROM clubs WHERE id = $1 AND manager_id = $2
    `, [clubId, userId]);
    
    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'you must be a member of this club to view members' });
    }
    
    // Get all club members including the manager
    const members = await pool.query(`
      SELECT u.id, COALESCE(u.display_name, u.username, u.email) as name,
             'manager' as role, 0 as sort_order
      FROM clubs c
      JOIN users u ON c.manager_id = u.id
      WHERE c.id = $1
      UNION
      SELECT u.id, COALESCE(u.display_name, u.username, u.email) as name,
             'member' as role, 1 as sort_order
      FROM user_clubs uc
      JOIN users u ON uc.user_id = u.id
      WHERE uc.club_id = $1
      ORDER BY sort_order ASC, name ASC
    `, [clubId]);

    res.json(members.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// MANAGER: Create invitation
app.post('/clubs/:clubId/invitations', authenticateToken, express.json(), async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { username } = req.body;
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (!username) return res.status(400).json({ error: 'username required' });
    
    const isManager = await ensureManager(userId, clubId);
    if (!isManager) return res.status(403).json({ error: 'only club managers can send invitations' });
    
    // Find user by username
    const invitedUser = await pool.query(`
      SELECT id FROM users 
      WHERE LOWER(username) = LOWER($1) 
         OR LOWER(display_name) = LOWER($1) 
         OR LOWER(email) = LOWER($1)
    `, [username]);
    if (!invitedUser.rows.length) return res.status(404).json({ error: 'user not found' });
    
    // Check if already a member
    const existingMember = await pool.query(`
      SELECT 1 FROM user_clubs 
      WHERE club_id = $1 AND user_id = $2
    `, [clubId, invitedUser.rows[0].id]);
    
    if (existingMember.rows.length) return res.status(400).json({ error: 'user is already a member' });
    
    // Create invitation (or update existing)
    await pool.query(`
      INSERT INTO club_invitations (club_id, invited_user_id, invited_by, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      ON CONFLICT (club_id, invited_user_id) 
      DO UPDATE SET status = 'pending', created_at = NOW()
    `, [clubId, invitedUser.rows[0].id, userId]);
    
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// USER: Get my join requests
app.get('/me/club-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const requests = await pool.query(`
      SELECT cjr.id, cjr.status, cjr.created_at, c.name as club_name
      FROM club_join_requests cjr
      JOIN clubs c ON cjr.club_id = c.id
      WHERE cjr.user_id = $1
      ORDER BY cjr.created_at DESC
    `, [userId]);
    
    res.json(requests.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// USER: Get my invitations
app.get('/me/invitations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const invitations = await pool.query(`
      SELECT ci.id, ci.status, ci.created_at, c.name as club_name
      FROM club_invitations ci
      JOIN clubs c ON ci.club_id = c.id
      WHERE ci.invited_user_id = $1
      ORDER BY ci.created_at DESC
    `, [userId]);
    
    res.json(invitations.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// USER: Accept/decline invitation
app.patch('/me/invitations/:inviteId', authenticateToken, express.json(), async (req, res) => {
  try {
    const inviteId = Number(req.params.inviteId);
    const { action } = req.body;
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or decline' });
    }
    
    // Get the invitation
    const invitation = await pool.query(`
      SELECT club_id FROM club_invitations 
      WHERE id = $1 AND invited_user_id = $2 AND status = 'pending'
    `, [inviteId, userId]);
    
    if (!invitation.rows.length) return res.status(404).json({ error: 'invitation not found or already processed' });
    
    if (action === 'accept') {
      await addMember(invitation.rows[0].club_id, userId);
      await pool.query(`
        UPDATE club_invitations 
        SET status = 'accepted' 
        WHERE id = $1
      `, [inviteId]);
    } else {
      await pool.query(`
        UPDATE club_invitations 
        SET status = 'declined' 
        WHERE id = $1
      `, [inviteId]);
    }
    
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Availability grid
// -------------------------------
app.get('/availability', async (req, res) => {
  try {
    const clubId = Number(req.query.clubId);
  const sport = String(req.query.sport || '').toLowerCase();
    const date = String(req.query.date || '');
    const userId = req.query.userId ? Number(req.query.userId) : null;

    const cfg = await db.prepare('SELECT * FROM club_sports WHERE club_id=? AND sport=?').get(clubId, sport);
    if (!cfg) return res.status(404).json({ error: 'sport not configured for this club' });

    const clubRow = await db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
    const isOwnClubManager = clubRow && Number(clubRow.manager_id) === Number(userId);

    // Build time slots based on slot_minutes
    const times = [];
    const step = Number(cfg.slot_minutes);
    let cur = Number(cfg.open_hour) * 60;
    const end = Number(cfg.close_hour) * 60;
    while (cur < end) {
      const hh = String(Math.floor(cur / 60)).padStart(2, '0');
      const mm = String(cur % 60).padStart(2, '0');
      times.push(`${hh}:${mm}`);
      cur += step;
    }

    // Determine club timezone early so we can mark which slots are in the past
    const clubTzRow = await db.prepare('SELECT timezone FROM clubs WHERE id = ?').get(clubId);
    const clubTz = clubTzRow && clubTzRow.timezone ? String(clubTzRow.timezone) : (process.env.DEFAULT_TIMEZONE || 'UTC');
    const nowDT_for_slots = DateTime.now().setZone(clubTz);

    // bookings table historically used different column names in various installs.
    // Inspect columns and query accordingly to avoid "column does not exist" errors.
    const bInfo = await tableInfo('bookings');
    // Inspect users table shape so we can avoid referencing username when it doesn't exist.
    const uInfo = await tableInfo('users');
    const uCols = new Set((uInfo || []).map(c => c.name));
    const bookedByExpr = uCols.has('username')
      ? 'COALESCE(u.username, u.display_name) AS booked_by'
      : (uCols.has('display_name') ? 'u.display_name AS booked_by' : (uCols.has('name') ? 'u.name AS booked_by' : 'NULL AS booked_by'));
    const bCols = new Set((bInfo || []).map(c => c.name));
    let bookings;

    // Preferred shape: club_id, sport, date, time, court_index
    if (bCols.has('club_id') && bCols.has('sport') && bCols.has('date') && bCols.has('time') && bCols.has('court_index')) {
  bookings = await db.prepare(`
  SELECT b.id, b.court_index, b.time, b.user_id, ${bookedByExpr}
    FROM bookings b
    LEFT JOIN users u ON u.id = b.user_id
    WHERE b.club_id=? AND b.sport=? AND b.date=?
  `).all(clubId, sport, date);

    // Alternate newer schema: bookings use court_id and time/date columns
    } else if (bCols.has('club_id') && bCols.has('sport') && bCols.has('date') && bCols.has('time') && bCols.has('court_id')) {
      // Map stored court_id -> zero-based courtIndex (order by courts.id)
      // court_index should be computed only from courts that belong to the requested sport
      const clubSportRow = await db.prepare('SELECT sport FROM clubs WHERE id = ?').get(clubId);
      const clubDefaultSport = clubSportRow ? String(clubSportRow.sport || '').toLowerCase() : '';
      const includeLegacyNull = (String(sport).toLowerCase() === clubDefaultSport);

      // Inspect courts table shape to avoid referencing c.sport when the column is absent.
      const courtsInfo = await tableInfo('courts');
      const courtsCols = new Set((courtsInfo || []).map(c => c.name));

      if (courtsCols.has('sport')) {
        bookings = await db.prepare(`
          SELECT b.id,
               (row_number() OVER (PARTITION BY c.club_id ORDER BY c.id) - 1) AS court_index,
               b.time, b.user_id, ${bookedByExpr}
        FROM bookings b
        JOIN courts c ON c.id = b.court_id
        LEFT JOIN users u ON u.id = b.user_id
        WHERE b.club_id=? AND b.sport=? AND b.date=?
          AND (c.sport = ? ${includeLegacyNull ? 'OR c.sport IS NULL' : ''})
      `).all(clubId, sport, date, sport);
      } else {
        // Fallback: court rows have no sport column; just map by court id ordering within the club
        bookings = await db.prepare(`
          SELECT b.id,
                 (row_number() OVER (PARTITION BY c.club_id ORDER BY c.id) - 1) AS court_index,
                 b.time, b.user_id, ${bookedByExpr}
          FROM bookings b
          JOIN courts c ON c.id = b.court_id
          LEFT JOIN users u ON u.id = b.user_id
          WHERE b.club_id=? AND b.sport=? AND b.date=?
        `).all(clubId, sport, date);
      }

    // Legacy schema (migrations/001_init.sql): bookings store court_id and starts_at/ends_at without club_id or sport
    } else if (bCols.has('court_id') && bCols.has('starts_at')) {
      // Legacy schema: bookings use court_id + starts_at/ends_at and may lack
      // sport/date/time. To support sport-scoped courts that were added later,
      // surface legacy bookings when the booking points to a court whose
      // sport matches the requested sport (and include NULL sport courts only
      // when the requested sport equals the club's default sport).
      // NOTE: older installations stored starts_at as UTC ISO strings. To avoid
      // server/DB session timezone differences (which caused +5h display shifts),
      // fetch the raw starts_at and compute the club-local date/time in JS using Luxon.
      const clubSportRow = await db.prepare('SELECT sport, timezone FROM clubs WHERE id = ?').get(clubId);
      const clubDefaultSport = clubSportRow ? String(clubSportRow.sport || '').toLowerCase() : '';
      const includeLegacyNull = (String(sport).toLowerCase() === clubDefaultSport);
      const clubTz = clubSportRow && clubSportRow.timezone ? String(clubSportRow.timezone) : (process.env.DEFAULT_TIMEZONE || 'UTC');

      // Build a derived, ordered list of courts for this club/sport
      // If the courts table lacks a 'sport' column (older installs), omit sport filters
      const courtsInfoForLegacy = await tableInfo('courts');
      const courtsColsForLegacy = new Set((courtsInfoForLegacy || []).map(c => c.name));
      const courtsFilterCond = courtsColsForLegacy.has('sport')
        ? `c2.club_id = ? AND (c2.sport = ? ${includeLegacyNull ? 'OR c2.sport IS NULL' : ''})`
        : `c2.club_id = ?`;
      // Select raw starts_at so we can interpret it as UTC and convert to club-local time in JS
        let rawRows = await db.prepare(`
        WITH courts_ordered AS (
          SELECT id, (row_number() OVER (ORDER BY id) - 1) AS court_index
          FROM courts c2
          WHERE ${courtsFilterCond}
          ORDER BY id
        )
        SELECT b.id,
               co.court_index,
               b.starts_at AS starts_at,
               b.user_id, ${bookedByExpr}
        FROM bookings b
        JOIN courts_ordered co ON co.id = b.court_id
        LEFT JOIN users u ON u.id = b.user_id
  `).all.apply(null, courtsColsForLegacy.has('sport') ? [clubId, String(sport)] : [clubId]);

      // Filter and normalize rows to the shape expected by the rest of the code:
      // { id, court_index, time, user_id, booked_by }
      bookings = (rawRows || []).map(r => {
        // starts_at may be returned by the driver as a JS Date object or a string.
        // Normalize parsing: prefer fromJSDate when appropriate, else fromISO.
        const raw = r.starts_at;
        let dtUTC = null;
        try {
          if (raw instanceof Date) {
            dtUTC = DateTime.fromJSDate(raw, { zone: 'utc' });
          } else {
            // String or other: coerce to string and parse as ISO in UTC
            dtUTC = DateTime.fromISO(String(raw), { zone: 'utc' });
          }
        } catch (e) {
          console.warn('DEBUG availability: could not parse starts_at for booking', r.id, String(raw));
          dtUTC = null;
        }

        const dtLocal = dtUTC && dtUTC.isValid ? dtUTC.setZone(clubTz) : null;
        return {
          id: r.id,
          court_index: r.court_index,
          time: dtLocal ? dtLocal.toFormat('HH:mm') : null,
          user_id: r.user_id,
          booked_by: r.booked_by || null,
          _starts_at: raw
        };
      }).filter(r => {
        // only include bookings that fall on the requested club-local date
        if (!r._starts_at || !r.time) return false;
        const src = r._starts_at;
        const dt = (src instanceof Date)
          ? DateTime.fromJSDate(src, { zone: 'utc' }).setZone(clubTz)
          : DateTime.fromISO(String(src), { zone: 'utc' }).setZone(clubTz);
        return dt.isValid && dt.toISODate() === String(date);
      });

    } else {
      // Last resort: return empty bookings to avoid crashing frontend
      bookings = [];
    }



  console.log('DEBUG availability: bookings columns:', Array.from(bCols).join(','));
  console.log('DEBUG availability: bookings count:', Array.isArray(bookings) ? bookings.length : 0);
  if (Array.isArray(bookings) && bookings.length) console.log('DEBUG availability: sample bookings', bookings.slice(0,5));

  const bookedSet = new Set(bookings.map(b => `${b.court_index}@${b.time}`));
    const ownedSet = userId != null
      ? new Set(bookings.filter(b => b.user_id === userId).map(b => `${b.court_index}@${b.time}`))
      : new Set();
    const idMap = new Map(bookings.map(b => [`${b.court_index}@${b.time}`, b.id]));
    const nameMap = new Map(bookings.map(b => [`${b.court_index}@${b.time}`, b.booked_by || null]));

    const grid = times.map(t => ({
      time: t,
      // mark whether this slot starts before the club-local now
      isPast: DateTime.fromISO(`${String(date)}T${t}`, { zone: clubTz }).toMillis() < nowDT_for_slots.toMillis(),
      courts: Array.from({ length: Number(cfg.courts) }).map((_, idx) => {
        const key = `${idx}@${t}`;
        return {
          courtIndex: idx,
          booked: bookedSet.has(key),
          owned: ownedSet.has(key),
          bookingId: idMap.get(key) || null,
          // Always include bookedBy when a slot is booked so the frontend can render
          // the booking owner inside the box. Previously this was only exposed to
          // the club manager; showing the display name helps users see who's booked.
          ...(bookedSet.has(key) ? { bookedBy: nameMap.get(key) || null } : {})
        };
      })
    }));

    // Debug: surface a sample of the grid and booking counts to the server log
    try {
      const sample = grid.find(g => g.time === '10:00') || grid[0];
      console.log('DEBUG availability response sample for', { clubId, sport, date, bookingsCount: Array.isArray(bookings) ? bookings.length : 0, sample });
    } catch (ie) {
      console.log('DEBUG availability response logging failed', ie && ie.message ? ie.message : ie);
    }

    // Include a server-side NOW() value (canonical DB/server time) so clients
    // can recompute "past" state consistently. Also include each slot's UTC
    // start so clients can compare against the server time without needing
    // timezone math on the client.
    const nowRow = await pool.query("SELECT NOW() AS now");
    const serverNowRaw = nowRow && nowRow.rows && nowRow.rows[0] ? nowRow.rows[0].now : null;
    const serverNowUtc = serverNowRaw ? (new Date(serverNowRaw)).toISOString() : (new Date()).toISOString();

    // Attach slotStartUtc to each row so clients can compare against serverNowUtc.
    const gridWithUtc = grid.map(r => ({
      ...r,
      slotStartUtc: DateTime.fromISO(`${String(date)}T${r.time}`, { zone: clubTz }).toUTC().toISO()
    }));

    res.json({ cfg: { courts: Number(cfg.courts) }, slots: gridWithUtc, serverNowUtc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Book / Cancel
// -------------------------------
app.post('/book', async (req, res) => {
  try {
    const { clubId, sport, courtIndex, date, time, userId, asUsername } = req.body || {};
    if (clubId == null || !sport || courtIndex == null || !date || !time || userId == null) {
      return res.status(400).json({ error: 'missing fields' });
    }

    // Diagnostic: log incoming payload for debugging court mapping issues
    console.log('POST /book payload:', { clubId, sport, courtIndex, date, time, userId, asUsername });

    const clubResult = await pool.query('SELECT manager_id FROM clubs WHERE id = $1', [Number(clubId)]);
    const clubRow = clubResult.rows.length > 0 ? clubResult.rows[0] : null;
    const isOwnClubManager = clubRow && Number(clubRow.manager_id) === Number(userId);

    let targetUserId = Number(userId);
    // When the manager assigns bookings to other users (asUsername), avoid
    // referencing a missing `username` column. Inspect the users table and
    // search by a column that actually exists (username, display_name, email, name).
    if (asUsername !== undefined && asUsername !== null) {
      if (!isOwnClubManager) {
        return res.status(403).json({ error: 'Only the club manager can assign bookings to other users.' });
      }

      const uInfoForLookup = await tableInfo('users');
      const uColsForLookup = new Set((uInfoForLookup || []).map(c => c.name));
      const lookup = String(asUsername).trim();
      let u = null;
      if (uColsForLookup.has('username')) {
        const result = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [lookup]);
        u = result.rows.length > 0 ? result.rows[0] : null;
      } else if (uColsForLookup.has('display_name')) {
        const result = await pool.query('SELECT id FROM users WHERE LOWER(display_name) = LOWER($1)', [lookup]);
        u = result.rows.length > 0 ? result.rows[0] : null;
      } else if (uColsForLookup.has('email')) {
        const result = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [lookup]);
        u = result.rows.length > 0 ? result.rows[0] : null;
      } else if (uColsForLookup.has('name')) {
        const result = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [lookup]);
        u = result.rows.length > 0 ? result.rows[0] : null;
      } else {
        return res.status(500).json({ error: 'Cannot lookup user: users table has no username/display_name/email/name column' });
      }

      if (!u) return res.status(400).json({ error: 'User not found' });
      targetUserId = u.id;
    }

  // enforce "1 active booking" for regular users only and choose queries according to bookings schema
  const bInfo = await tableInfo('bookings');
  const bCols = new Set((bInfo || []).map(c => c.name));

    // Determine club timezone and slot length by querying club_sports so we compute
    // booking end-times using the configured slot_minutes instead of assuming 1 hour.
    const clubTzResult = await pool.query('SELECT timezone FROM clubs WHERE id = $1', [Number(clubId)]);
    const clubRowForTzRoot = clubTzResult.rows.length > 0 ? clubTzResult.rows[0] : null;
    const clubTzRoot = clubRowForTzRoot && clubRowForTzRoot.timezone ? String(clubRowForTzRoot.timezone) : (req.body && req.body.clubTimezone) || (process.env.DEFAULT_TIMEZONE || 'UTC');
    // Fetch configured slot length for this sport/club (fallback to 60 minutes)
    let slotMinutes = 60;
    try {
      const cfgResult = await pool.query('SELECT slot_minutes FROM club_sports WHERE club_id = $1 AND sport = $2', [Number(clubId), String(sport)]);
      const cfgRow = cfgResult.rows.length > 0 ? cfgResult.rows[0] : null;
      if (cfgRow && cfgRow.slot_minutes) slotMinutes = Number(cfgRow.slot_minutes) || 60;
    } catch (e) {
      // ignore and default to 60
    }

    // Helper: unified active-booking check using DB NOW(). Block if any booking
    // for this user has status in ('upcoming','active') AND end_time > NOW().
    // Adapt queries to the available schema.
    let hasActive = null;

  const hasStatusCol = bCols.has('status');

  if (bCols.has('date') && bCols.has('time')) {
      // Modern schema: bookings store date + time (slot start). We assume 1-hour
      // durations and compare booking end (time + interval '1 hour') against NOW().
      // Use the database's NOW() as the canonical time.
      // Use configured slotMinutes when computing booking end
      // Build SQL defensively: only reference `status` when the column exists.
      // Use the club's timezone when interpreting stored date+time strings so
      // comparisons against NOW() are correct regardless of DB timezone.
      if (hasStatusCol) {
        hasActive = await pool.query(`
          SELECT 1 FROM bookings
          WHERE user_id = $1 AND club_id = $2
            AND (
              (status IS NOT NULL AND status IN ('upcoming','active') AND ((to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI') AT TIME ZONE $3) + ($4 * interval '1 minute')) > NOW())
              OR
              (status IS NULL AND ((to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI') AT TIME ZONE $3) + ($4 * interval '1 minute')) > NOW())
            )
          LIMIT 1
        `, [Number(targetUserId), Number(clubId), String(clubTzRoot), Number(slotMinutes)]);
        hasActive = hasActive.rows.length > 0 ? hasActive.rows[0] : null;
      } else {
        hasActive = await pool.query(`
          SELECT 1 FROM bookings
          WHERE user_id = $1 AND club_id = $2
            AND (((to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI') AT TIME ZONE $3) + ($4 * interval '1 minute')) > NOW())
          LIMIT 1
        `, [Number(targetUserId), Number(clubId), String(clubTzRoot), Number(slotMinutes)]);
        hasActive = hasActive.rows.length > 0 ? hasActive.rows[0] : null;
      }

  } else if (bCols.has('starts_at')) {
      // Legacy schema: bookings have starts_at/ends_at timestamps. Prefer ends_at when present.
      // Use slotMinutes for legacy starts_at when ends_at is null
      if (hasStatusCol) {
        hasActive = await pool.query(`
          SELECT 1 FROM bookings
          WHERE user_id = $1
            AND (
              (status IS NOT NULL AND status IN ('upcoming','active') AND ((ends_at IS NOT NULL AND ends_at > NOW()) OR (ends_at IS NULL AND (starts_at + ($2 * interval '1 minute')) > NOW())))
              OR
              (status IS NULL AND ((ends_at IS NOT NULL AND ends_at > NOW()) OR (ends_at IS NULL AND (starts_at + ($2 * interval '1 minute')) > NOW())))
            )
          LIMIT 1
        `, [Number(targetUserId), Number(slotMinutes)]);
        hasActive = hasActive.rows.length > 0 ? hasActive.rows[0] : null;
      } else {
        hasActive = await pool.query(`
          SELECT 1 FROM bookings
          WHERE user_id = $1
            AND ((ends_at IS NOT NULL AND ends_at > NOW()) OR (ends_at IS NULL AND (starts_at + ($2 * interval '1 minute')) > NOW()))
          LIMIT 1
        `, [Number(targetUserId), Number(slotMinutes)]);
        hasActive = hasActive.rows.length > 0 ? hasActive.rows[0] : null;
      }

    } else {
      // Unknown schema: be conservative and skip DB check (avoid false blocks)
      hasActive = null;
    }

    if (!isOwnClubManager && hasActive) {
      return res.status(409).json({ error: 'You already have an active booking. Cancel it or wait until it has passed.' });
    }

    // Duplicate/slot-check + insertion must also follow schema
    if (bCols.has('club_id') && bCols.has('sport') && bCols.has('date') && bCols.has('time') && bCols.has('court_index')) {
      // Preferred modern schema
      // Prevent booking in the past according to club-local now (luxon)
  const clubTz = clubTzRoot;
  const requestedDT = DateTime.fromISO(`${String(date)}T${String(time)}`, { zone: clubTz });
  const requestedEndDT = requestedDT.plus({ minutes: slotMinutes });
      const nowDT = DateTime.now().setZone(clubTz);
      console.debug('booking check (modern schema)', { clubId, clubTz, requestedStart: requestedDT.toISO(), requestedEnd: requestedEndDT.toISO(), now: nowDT.toISO(), valid: requestedDT.isValid });
      // Allow booking if the booking's end time is strictly after now (i.e., you may book up until the last minute before it ends)
      if (!requestedDT.isValid || requestedEndDT.toMillis() <= nowDT.toMillis()) {
        console.warn('Rejecting past booking (modern schema)', { clubId, clubTz, requestedStart: requestedDT.toISO(), requestedEnd: requestedEndDT.toISO(), now: nowDT.toISO() });
        return res.status(400).json({ error: 'Cannot book a slot in the past' });
      }

      const dup = await db.prepare(`
        SELECT 1 FROM bookings
        WHERE club_id = ? AND sport = ? AND court_index = ? AND date = ? AND time = ?
        LIMIT 1
      `).get(Number(clubId), String(sport), Number(courtIndex), String(date), String(time));
      if (dup) return res.status(409).json({ error: 'slot already booked' });

      await db.prepare(`
        INSERT INTO bookings (club_id, sport, court_index, date, time, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(Number(clubId), String(sport), Number(courtIndex), String(date), String(time), Number(targetUserId));

    } else if (bCols.has('club_id') && bCols.has('sport') && bCols.has('date') && bCols.has('time') && bCols.has('court_id')) {
      // Older variant that stores court_id instead of court_index.
      // The client provides a zero-based `courtIndex`. Map that to the
      // actual `courts.id` for this club (ORDER BY id LIMIT 1 OFFSET courtIndex)
      // Find the clubs' courts for this sport (or include legacy NULL-sport courts when appropriate)
      const clubSportRow2 = await db.prepare('SELECT sport FROM clubs WHERE id = ?').get(clubId);
      const clubDefaultSport2 = clubSportRow2 ? String(clubSportRow2.sport || '').toLowerCase() : '';
      const includeLegacyNull2 = (String(sport).toLowerCase() === clubDefaultSport2);

      const courtRow = await db.prepare(
        `SELECT id FROM courts WHERE club_id = ? AND (sport = ? ${includeLegacyNull2 ? 'OR sport IS NULL' : ''}) ORDER BY id ASC LIMIT 1 OFFSET ?`
      ).get(Number(clubId), String(sport), Number(courtIndex));
      if (!courtRow || courtRow.id == null) {
        console.error('Booking: no courts found for club', clubId, 'offset', courtIndex);
        return res.status(400).json({ error: 'No courts configured for this club — please create courts before booking (or provide explicit court_id).' });
      }
      const courtIdToUse = Number(courtRow.id);

      // Prevent booking in the past per club-local now (luxon)
  const clubTz2 = clubTzRoot;
  const requestedDT2 = DateTime.fromISO(`${String(date)}T${String(time)}`, { zone: clubTz2 });
  const requestedEndDT2 = requestedDT2.plus({ minutes: slotMinutes });
      const nowDT2 = DateTime.now().setZone(clubTz2);
      console.debug('booking check (court_id schema)', { clubId, clubTz2, requestedStart: requestedDT2.toISO(), requestedEnd: requestedEndDT2.toISO(), now: nowDT2.toISO(), valid: requestedDT2.isValid });
      if (!requestedDT2.isValid || requestedEndDT2.toMillis() <= nowDT2.toMillis()) {
        console.warn('Rejecting past booking (court_id schema)', { clubId, clubTz2, requestedStart: requestedDT2.toISO(), requestedEnd: requestedEndDT2.toISO(), now: nowDT2.toISO() });
        return res.status(400).json({ error: 'Cannot book a slot in the past' });
      }

      const dup = await db.prepare(`
        SELECT 1 FROM bookings
        WHERE club_id = ? AND sport = ? AND court_id = ? AND date = ? AND time = ?
        LIMIT 1
      `).get(Number(clubId), String(sport), courtIdToUse, String(date), String(time));
      if (dup) return res.status(409).json({ error: 'slot already booked' });

      await db.prepare(`
        INSERT INTO bookings (club_id, sport, court_id, date, time, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(Number(clubId), String(sport), courtIdToUse, String(date), String(time), Number(targetUserId));

    } else if (bCols.has('court_id') && bCols.has('starts_at')) {
      // Legacy schema: courts are separate table. Map client zero-based courtIndex
      // to the actual courts.id for this club. Prefer sport-scoped courts when
      // available so new sports map to their own courts instead of legacy ones.
      const requestedSport = String(sport).toLowerCase();
      const clubSportRow3 = await db.prepare('SELECT sport FROM clubs WHERE id = ?').get(clubId);
      const clubDefaultSport3 = clubSportRow3 ? String(clubSportRow3.sport || '').toLowerCase() : '';
      const includeLegacyNull3 = (requestedSport === clubDefaultSport3);

      // Build SQL to prefer courts matching the sport, including NULL for default sport
      const courtSql = `SELECT id FROM courts WHERE club_id = ? AND (sport = ? ${includeLegacyNull3 ? 'OR sport IS NULL' : ''}) ORDER BY id ASC LIMIT 1 OFFSET ?`;
      console.log('DEBUG legacy booking mapping:', { clubId: Number(clubId), requestedSport, includeLegacyNull: includeLegacyNull3, sql: courtSql });

      let courtRow = await db.prepare(courtSql).get(Number(clubId), requestedSport, Number(courtIndex));
      let courtId;
      if (courtRow && courtRow.id != null) {
        courtId = Number(courtRow.id);
      } else {
        console.error('Legacy booking: no courts found for club', clubId, 'offset', courtIndex);
        return res.status(400).json({ error: 'No courts configured for this club — please create courts before booking (or provide explicit court_id).' });
      }

      // Build a timestamp from date + time and check starts_at
      const startsAt = `${String(date)} ${String(time)}`; // 'YYYY-MM-DD HH:MM'
      // Parse client-provided date/time into a club-local moment using the resolved club timezone.
      const clubTzFinal = clubTzRoot;
  const requestedDT3 = DateTime.fromISO(`${String(date)}T${String(time)}`, { zone: clubTzFinal });
  const requestedEndDT3 = requestedDT3.plus({ minutes: slotMinutes });
      const nowDT3 = DateTime.now().setZone(clubTzFinal);
      console.debug('booking check (legacy starts_at)', { clubId, clubTz: clubTzFinal, requestedStart: requestedDT3.toISO(), requestedEnd: requestedEndDT3.toISO(), now: nowDT3.toISO(), valid: requestedDT3.isValid });
      if (!requestedDT3.isValid || requestedEndDT3.toMillis() <= nowDT3.toMillis()) {
        console.warn('Rejecting past booking (legacy starts_at)', { clubId, clubTz: clubTzFinal, requestedStart: requestedDT3.toISO(), requestedEnd: requestedEndDT3.toISO(), now: nowDT3.toISO() });
        return res.status(400).json({ error: 'Cannot book a slot in the past' });
      }

  const startDt = new Date(requestedDT3.toUTC().toISO());
  // Use configured slotMinutes to compute end time consistently across schemas
  const endDt = new Date(requestedDT3.plus({ minutes: slotMinutes }).toUTC().toISO());

      const dup = await db.prepare(`
        SELECT 1 FROM bookings b
        WHERE b.court_id = ? AND b.starts_at::date = ? AND to_char(b.starts_at,'HH24:MI') = ?
        LIMIT 1
      `).get(courtId, String(date), String(time));
      if (dup) {
        console.log('DEBUG duplicate detected for courtId', courtId, 'date', date, 'time', time);
        return res.status(409).json({ error: 'slot already booked' });
      }

      // Use ISO timestamp strings to avoid SQL casting edge-cases; Postgres accepts ISO 8601
      const startsAtISO = startDt.toISOString();
      const endsAtISO = endDt.toISOString();

      // Diagnostic log: print parameters we will insert so we can inspect them
      console.log('DEBUG booking insert params:', { clubId: Number(clubId), courtId, startsAtISO, endsAtISO, targetUserId: Number(targetUserId) });

      await db.prepare(`
        INSERT INTO bookings (club_id, court_id, starts_at, ends_at, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(Number(clubId), courtId, startsAtISO, endsAtISO, Number(targetUserId));

    } else {
      // Unknown bookings schema: cannot safely insert -> return helpful error
      console.error('Unsupported bookings schema; columns:', Array.from(bCols).join(','));
      return res.status(500).json({ error: 'server bookings schema not supported on this installation' });
    }

    res.json({ ok: true });
  } catch (e) {
    // Log full stack for debugging and return the message so the client can see the cause.
    console.error('POST /book error:', e && e.stack ? e.stack : e);
    if (String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'slot already booked' });
    }
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Create looking table if it doesn't exist
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS looking (
      id BIGSERIAL PRIMARY KEY,
      club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      looking_since TIMESTAMP DEFAULT NOW(),
      looking_from TEXT,
      looking_to TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(club_id, user_id)
    );
  `);
} catch (e) {
  console.warn('Could not ensure looking table:', e && e.message ? e.message : e);
}

// Simple in-memory "looking" presence store for development fallback.
// Keys: clubId -> array of { player_id, user_id, display_name, looking_since, lookingFrom?, lookingTo? }
const _devLookingStore = new Map();

// GET /clubs/:clubId/looking -> list of lookers
app.get('/clubs/:clubId/looking', async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    
    // Try database first, fallback to in-memory store
    try {
      const rows = await pool.query(`
        SELECT l.user_id, l.display_name, l.looking_since, l.looking_from, l.looking_to,
               COALESCE(l.player_id, p.id) as player_id
        FROM looking l
        LEFT JOIN players p ON p.club_id = l.club_id AND p.user_id = l.user_id
        WHERE l.club_id = $1
        ORDER BY l.looking_since ASC
      `, [clubId]);
      
      const formatted = rows.rows.map(row => ({
        player_id: row.player_id || `local-${row.user_id}`,
        user_id: Number(row.user_id),
        display_name: row.display_name,
        looking_since: new Date(row.looking_since).getTime(),
        lookingFrom: row.looking_from,
        lookingTo: row.looking_to
      }));
      
      return res.json(formatted);
    } catch (dbErr) {
      console.warn('Database looking query failed, using in-memory store:', dbErr.message);
      const rows = _devLookingStore.get(clubId) || [];
      return res.json(rows);
    }
  } catch (e) {
    console.error('/clubs/:clubId/looking GET error', e && e.stack ? e.stack : e);
    return res.status(500).json({ error: 'unexpected error' });
  }
});

// POST /clubs/:clubId/looking { userId, looking, lookingFrom?, lookingTo? }
app.post('/clubs/:clubId/looking', express.json(), async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { userId, looking, lookingFrom, lookingTo } = req.body || {};
    if (!clubId || !userId || typeof looking === 'undefined') return res.status(400).json({ error: 'clubId, userId and looking required' });
    
    // Try database first, fallback to in-memory store
    try {
      if (looking) {
        // Get user info for display name
        const user = await pool.query('SELECT display_name FROM users WHERE id = $1', [Number(userId)]);
        const displayName = user.rows[0]?.display_name || `user${userId}`;
        
        // Get or create player
        let player = await pool.query('SELECT id FROM players WHERE club_id = $1 AND user_id = $2', [clubId, Number(userId)]);
        let playerId = player.rows[0]?.id;
        
        if (!playerId) {
          const newPlayer = await pool.query(
            'INSERT INTO players (club_id, user_id, display_name) VALUES ($1, $2, $3) RETURNING id',
            [clubId, Number(userId), displayName]
          );
          playerId = newPlayer.rows[0].id;
        }
        
        // Upsert looking entry
        await pool.query(`
          INSERT INTO looking (club_id, user_id, player_id, display_name, looking_from, looking_to)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (club_id, user_id)
          DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            looking_since = NOW(),
            looking_from = EXCLUDED.looking_from,
            looking_to = EXCLUDED.looking_to
        `, [clubId, Number(userId), playerId, displayName, lookingFrom || null, lookingTo || null]);
        
        return res.json({ ok: true, looking: true });
      } else {
        // Remove looking entry
        await pool.query('DELETE FROM looking WHERE club_id = $1 AND user_id = $2', [clubId, Number(userId)]);
        return res.json({ ok: true, looking: false });
      }
    } catch (dbErr) {
      console.warn('Database looking operation failed, using in-memory store:', dbErr.message);
      // Fallback to in-memory store
      const list = _devLookingStore.get(clubId) || [];
      const filtered = list.filter(r => Number(r.user_id) !== Number(userId));
      if (looking) {
        const entry = { player_id: `local-${userId}`, user_id: Number(userId), display_name: `user${userId}`, looking_since: Date.now(), lookingFrom: lookingFrom || null, lookingTo: lookingTo || null };
        filtered.unshift(entry);
        _devLookingStore.set(clubId, filtered);
        return res.json({ ok: true, looking: true });
      } else {
        _devLookingStore.set(clubId, filtered);
        return res.json({ ok: true, looking: false });
      }
    }
  } catch (e) {
    console.error('/clubs/:clubId/looking POST error', e && e.stack ? e.stack : e);
    return res.status(500).json({ error: 'unexpected error' });
  }
});

app.post('/cancel', async (req, res) => {
  try {
    const { bookingId, userId } = req.body || {};
    if (bookingId == null || userId == null) return res.status(400).json({ error: 'bookingId, userId required' });

    const row = await db.prepare('SELECT club_id, user_id FROM bookings WHERE id = ?').get(Number(bookingId));
    if (!row) return res.status(404).json({ error: 'booking not found' });

    const clubRow = await db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(Number(row.club_id));
    const managerId = clubRow ? Number(clubRow.manager_id) : null;

    const isOwner = Number(row.user_id) === Number(userId);
    const isManager = managerId === Number(userId);

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: 'not allowed' });
    }

    await db.prepare('DELETE FROM bookings WHERE id = ?').run(Number(bookingId));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Debug endpoint: reports whether a user has an active booking (development only)
app.get('/debug/active-booking', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'not available' });
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const clubId = req.query.clubId ? Number(req.query.clubId) : null;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const bInfo = await tableInfo('bookings');
    const bCols = new Set((bInfo || []).map(c => c.name));
    const hasStatusCol = bCols.has('status');

    // Determine slot length for club when available
    const cfg = await db.prepare('SELECT slot_minutes FROM club_sports WHERE club_id = ? LIMIT 1').get(clubId || null);
    const slotMinutes = cfg && cfg.slot_minutes ? Number(cfg.slot_minutes) : 60;

    if (bCols.has('date') && bCols.has('time')) {
      // modern schema: convert date+time into timestamp using club timezone
      const clubRow = await db.prepare('SELECT timezone FROM clubs WHERE id = ?').get(clubId);
      const clubTz = clubRow && clubRow.timezone ? String(clubRow.timezone) : 'UTC';

      const selectStatus = hasStatusCol ? ', status' : '';
      const q = `
        SELECT id, user_id, club_id, date, time${selectStatus},
          ((to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI') AT TIME ZONE $3) + ($4 * interval '1 minute')) AS end_at
        FROM bookings
        WHERE user_id = $1
          AND ($2 IS NULL OR club_id = $2)
        ORDER BY end_at DESC LIMIT 50`;

  const { rows } = await pool.query(q, [userId, clubId, clubTz, slotMinutes]);
      const now = (await pool.query('SELECT NOW() AS now')).rows[0].now;
      const hasActive = rows.some(r => {
        const endAt = r.end_at;
        if (!endAt || !(endAt > now)) return false;
        if (!hasStatusCol) return true;
        return (r.status == null || ['upcoming','active'].includes(r.status));
      });
      return res.json({ schema: 'modern', now, rows, hasActive });
    }

    if (bCols.has('starts_at')) {
      const selectStatus = hasStatusCol ? ', status' : '';
      const q = `
        SELECT id, user_id, starts_at, ends_at${selectStatus}, COALESCE(ends_at, starts_at + ($2 * interval '1 minute')) AS end_at
        FROM bookings
        WHERE user_id = $1
        ORDER BY end_at DESC LIMIT 50`;
  const { rows } = await pool.query(q, [userId, slotMinutes]);
      const now = (await pool.query('SELECT NOW() AS now')).rows[0].now;
      const hasActive = rows.some(r => {
        const endAt = r.end_at;
        if (!endAt || !(endAt > now)) return false;
        if (!hasStatusCol) return true;
        return (r.status == null || ['upcoming','active'].includes(r.status));
      });
      return res.json({ schema: 'legacy', now, rows, hasActive });
    }

    return res.json({ schema: 'unknown', hasActive: null });
  } catch (e) {
    console.error('/debug/active-booking error', e && e.stack ? e.stack : e);
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

// -------------------------------
// Server
// -------------------------------
export async function logDbIdentity() {
  try {
    const [{ db, usr }] = (await pool.query(
      'select current_database() as db, current_user as usr'
    )).rows;
    const ver = (await pool.query('select version()')).rows?.[0]?.version || '';
    console.log(`[db] connected to "${db}" as "${usr}"`);
    if (ver) console.log(`[db] ${ver}`);
  } catch (e) {
    console.warn('[db] identity check failed:', e.message || e);
  }
}
// Ensure PORT is a number (some platforms provide it as a string)
const PORT = Number(process.env.PORT) || 5051;

// Log DB identity at startup to help diagnose which DATABASE_URL the
// running process actually connected to (useful on Render where envs vary).
try {
  await logDbIdentity();
} catch (e) {
  console.warn('logDbIdentity failed at startup:', e && e.message ? e.message : e);
}

// Safety guard: prevent accidental automatic execution of migration scripts
// from within server startup. Some projects call migration runners during
// deployment; if you add automation that triggers `node migrate.mjs`, ensure
// you set ALLOW_DESTRUCTIVE_MIGRATIONS=1 explicitly. If an environment or
// deployment system attempts to run migrations by setting AUTO_RUN_MIGRATIONS,
// abort unless the destructive flag is set too.
if (process.env.AUTO_RUN_MIGRATIONS === '1' && process.env.ALLOW_DESTRUCTIVE_MIGRATIONS !== '1') {
  console.error('\nFATAL: AUTO_RUN_MIGRATIONS is enabled but ALLOW_DESTRUCTIVE_MIGRATIONS is not set.');
  console.error('To run migrations automatically in this environment, explicitly set ALLOW_DESTRUCTIVE_MIGRATIONS=1.');
  console.error('This prevents accidental execution of destructive SQL (DROP/TRUNCATE) against live databases.');
  // Exit to fail fast and avoid running with a dangerous automated migration flag.
  process.exit(2);
}

// ================== CHAT API ENDPOINTS ==================

// Helper function to ensure user_a < user_b for consistent conversation ordering
function orderUserIds(userId1, userId2) {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

// GET /api/chat/conversations
// Get all conversations for the current user
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) return res.status(401).json({ error: 'unauthorized' });

    // Get all conversations the user is part of, with latest message info
    const conversations = await pool.query(`
      SELECT 
        c.*,
        club.name as club_name,
        CASE 
          WHEN c.user_a = $1 THEN user_b_user.display_name 
          ELSE user_a_user.display_name 
        END as other_user_name,
        CASE 
          WHEN c.user_a = $1 THEN c.user_b 
          ELSE c.user_a 
        END as other_user_id,
        latest_msg.body as latest_message,
        latest_msg.created_at as latest_message_time,
        latest_msg.sender_id as latest_message_sender_id,
        CASE 
          WHEN latest_msg.sender_id = $1 THEN true 
          ELSE false 
        END as latest_message_is_mine
      FROM conversations c
      JOIN clubs club ON c.club_id = club.id
      LEFT JOIN users user_a_user ON c.user_a = user_a_user.id
      LEFT JOIN users user_b_user ON c.user_b = user_b_user.id
      LEFT JOIN LATERAL (
        SELECT body, created_at, sender_id
        FROM messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY m.created_at DESC 
        LIMIT 1
      ) latest_msg ON true
      WHERE c.user_a = $1 OR c.user_b = $1
      ORDER BY 
        CASE WHEN latest_msg.created_at IS NULL THEN c.updated_at ELSE latest_msg.created_at END DESC
    `, [currentUserId]);

    res.json(conversations.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// POST /api/chat/conversations/get-or-create
// Get existing conversation or create new one between two users in a club
app.post('/api/chat/conversations/get-or-create', authenticateToken, async (req, res) => {
  try {
    const { club_id, other_user_id } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) return res.status(401).json({ error: 'unauthorized' });
    if (!club_id || !other_user_id) {
      return res.status(400).json({ error: 'club_id and other_user_id are required' });
    }

    // Verify both users are members of the club
    const membershipCheck = await pool.query(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id FROM user_clubs WHERE club_id = $1 AND user_id IN ($2, $3)
        UNION
        SELECT manager_id as user_id FROM clubs WHERE id = $1 AND manager_id IN ($2, $3)
      ) AS members
    `, [club_id, currentUserId, other_user_id]);

    if (membershipCheck.rows[0].count < 2) {
      return res.status(403).json({ error: 'both users must be members of this club' });
    }

    // Order user IDs consistently
    const [user_a, user_b] = orderUserIds(currentUserId, other_user_id);

    // Try to get existing conversation
    let conversation = await pool.query(`
      SELECT * FROM conversations 
      WHERE club_id = $1 AND user_a = $2 AND user_b = $3
    `, [club_id, user_a, user_b]);

    // Create conversation if it doesn't exist
    if (conversation.rows.length === 0) {
      conversation = await pool.query(`
        INSERT INTO conversations (club_id, user_a, user_b)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [club_id, user_a, user_b]);
    }

    const conversationData = conversation.rows[0];

    // Get recent messages (last 50)
    const messages = await pool.query(`
      SELECT m.*, u.display_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT 50
    `, [conversationData.id]);

    res.json({
      conversation: conversationData,
      messages: messages.rows.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('Error in get-or-create conversation:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// GET /api/chat/conversations/:id/messages
// Load full message history for a conversation
app.get('/api/chat/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const currentUserId = req.user?.id;

    if (!currentUserId) return res.status(401).json({ error: 'unauthorized' });

    // Verify user is part of this conversation
    const conversationCheck = await pool.query(`
      SELECT * FROM conversations 
      WHERE id = $1 AND (user_a = $2 OR user_b = $2)
    `, [conversationId, currentUserId]);

    if (conversationCheck.rows.length === 0) {
      return res.status(403).json({ error: 'access denied to this conversation' });
    }

    // Get all messages with pagination support
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const messages = await pool.query(`
      SELECT m.*, u.display_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `, [conversationId, limit, offset]);

    res.json({
      messages: messages.rows,
      pagination: {
        page,
        limit,
        hasMore: messages.rows.length === limit
      }
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// POST /api/chat/messages
// Send a new message
app.post('/api/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, body } = req.body;
    const senderId = req.user?.id;

    if (!senderId) return res.status(401).json({ error: 'unauthorized' });
    if (!conversation_id || !body || body.trim().length === 0) {
      return res.status(400).json({ error: 'conversation_id and non-empty body are required' });
    }

    // Verify user is part of this conversation
    const conversationCheck = await pool.query(`
      SELECT * FROM conversations 
      WHERE id = $1 AND (user_a = $2 OR user_b = $2)
    `, [conversation_id, senderId]);

    if (conversationCheck.rows.length === 0) {
      return res.status(403).json({ error: 'access denied to this conversation' });
    }

    // Insert the message
    const message = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, body)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [conversation_id, senderId, body.trim()]);

    // Get sender info for the response
    const messageWithSender = await pool.query(`
      SELECT m.*, u.display_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [message.rows[0].id]);

    res.status(201).json(messageWithSender.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// -------------------- FEEDBACK ENDPOINTS --------------------

// Rate limiting for feedback submissions
const feedbackRateLimit = new Map();

const checkFeedbackRateLimit = (req, res, next) => {
  const clientKey = req.user?.id ? `user_${req.user.id}` : `ip_${req.ip}`;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 3;

  if (!feedbackRateLimit.has(clientKey)) {
    feedbackRateLimit.set(clientKey, []);
  }

  const requests = feedbackRateLimit.get(clientKey);
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return res.status(429).json({ error: 'too many feedback submissions, please try again later' });
  }

  validRequests.push(now);
  feedbackRateLimit.set(clientKey, validRequests);
  next();
};

// POST /api/feedback - Submit feedback (auth optional)
app.post('/api/feedback', checkFeedbackRateLimit, async (req, res) => {
  try {
    const {
      rating,
      category,
      message,
      allow_contact = true,
      email,
      club_id,
      attachment_data // base64 string
    } = req.body;

    // Validation
    if (!category || !['bug', 'ux', 'feature', 'other'].includes(category)) {
      return res.status(400).json({ error: 'invalid category' });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 2000) {
      return res.status(400).json({ error: 'message must be between 10 and 2000 characters' });
    }

    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    if (club_id && (typeof club_id !== 'number' || club_id < 1)) {
      return res.status(400).json({ error: 'invalid club_id' });
    }

    const user_id = req.user?.id || null;
    const user_agent = req.headers['user-agent'] || '';
    const app_version = req.headers['x-app-version'] || '';
    
    let attachment_url = null;

    // Handle attachment upload (basic base64 implementation)
    if (attachment_data && typeof attachment_data === 'string') {
      try {
        // Basic validation for image data
        if (attachment_data.startsWith('data:image/')) {
          const matches = attachment_data.match(/^data:image\/(\w+);base64,(.+)$/);
          if (matches && ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(matches[1])) {
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Check file size (2MB limit)
            if (buffer.length > 2 * 1024 * 1024) {
              return res.status(400).json({ error: 'image too large, max 2MB' });
            }

            // Generate filename and save file
            const timestamp = Date.now();
            const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const filename = `feedback_${timestamp}.${extension}`;
            const filepath = path.join(__dirname, 'uploads', 'feedback', filename);
            
            // Save file to disk
            try {
              fs.writeFileSync(filepath, buffer);
              console.log(`[FEEDBACK] Saved attachment: ${filename} (${buffer.length} bytes)`);
              
              // Generate URL that points to the server 
              // Use the host from the request or environment variable
              const host = req.get('host') || req.headers.host;
              const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
              attachment_url = `${protocol}://${host}/uploads/feedback/${filename}`;
            } catch (writeError) {
              console.error('Error saving file:', writeError);
              return res.status(500).json({ error: 'failed to save attachment' });
            }
          }
        }
      } catch (error) {
        console.error('Error processing attachment:', error);
        return res.status(400).json({ error: 'invalid attachment data' });
      }
    }

    // Insert feedback
    const result = await pool.query(`
      INSERT INTO feedback (
        user_id, club_id, rating, category, message, 
        allow_contact, email, attachment_url, app_version, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `, [
      user_id, club_id, rating, category, message.trim(),
      allow_contact, email, attachment_url, app_version, user_agent
    ]);

    const feedback = result.rows[0];

    // Fire-and-forget notifications
    setImmediate(async () => {
      try {
        // Email notification
        if (process.env.EMAIL_FROM && process.env.RESEND_API_KEY) {
          await sendEmail({
            to: process.env.EMAIL_FROM,
            subject: `New feedback: ${category} ${rating ? '★'.repeat(rating) : ''}`,
            html: `
              <h3>New Feedback Received</h3>
              <p><strong>Category:</strong> ${category}</p>
              ${rating ? `<p><strong>Rating:</strong> ${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              ${user_id ? `<p><strong>User ID:</strong> ${user_id}</p>` : '<p><strong>Anonymous feedback</strong></p>'}
              ${club_id ? `<p><strong>Club ID:</strong> ${club_id}</p>` : ''}
              ${email ? `<p><strong>Contact:</strong> ${email}</p>` : ''}
              ${attachment_url ? `<p><strong>Attachment:</strong> ${attachment_url}</p>` : ''}
              <p><strong>Submitted:</strong> ${feedback.created_at}</p>
              ${process.env.APP_ORIGIN ? `<p><a href="${process.env.APP_ORIGIN}/admin/feedback?id=${feedback.id}">View in Admin</a></p>` : ''}
            `
          });
        }

        // Webhook notification
        if (process.env.FEEDBACK_WEBHOOK_URL) {
          await fetch(process.env.FEEDBACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: feedback.id,
              category,
              rating,
              message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
              user_id,
              club_id,
              created_at: feedback.created_at,
              admin_url: process.env.APP_ORIGIN ? `${process.env.APP_ORIGIN}/admin/feedback?id=${feedback.id}` : null
            })
          });
        }
      } catch (error) {
        console.error('Error sending feedback notifications:', error);
      }
    });

    res.json({ ok: true, id: feedback.id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// GET /api/feedback - List feedback (managers/admins only)
app.get('/api/feedback', authenticateToken, async (req, res) => {
  try {
    // Check if user is a manager (simplified check)
    const userClubs = await pool.query('SELECT id FROM clubs WHERE manager_id = $1', [req.user.id]);
    if (userClubs.rows.length === 0) {
      return res.status(403).json({ error: 'access denied' });
    }

    const {
      page = 1,
      limit = 50,
      status,
      category,
      club_id,
      min_rating
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`f.status = $${paramIndex++}`);
      params.push(status);
    }

    if (category) {
      whereConditions.push(`f.category = $${paramIndex++}`);
      params.push(category);
    }

    if (club_id) {
      whereConditions.push(`f.club_id = $${paramIndex++}`);
      params.push(parseInt(club_id));
    }

    if (min_rating) {
      whereConditions.push(`f.rating >= $${paramIndex++}`);
      params.push(parseInt(min_rating));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        f.id, f.user_id, f.club_id, f.rating, f.category, f.message, 
        f.allow_contact, f.email, f.attachment_url, f.app_version, 
        f.created_at, f.handled_at, f.status,
        u.display_name as user_name,
        c.name as club_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN clubs c ON f.club_id = c.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM feedback f
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      feedback: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// PATCH /api/feedback/:id - Update feedback status (managers/admins only)
app.patch('/api/feedback/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is a manager
    const userClubs = await pool.query('SELECT id FROM clubs WHERE manager_id = $1', [req.user.id]);
    if (userClubs.rows.length === 0) {
      return res.status(403).json({ error: 'access denied' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['new', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const handled_at = ['resolved', 'dismissed'].includes(status) ? 'now()' : null;

    const result = await pool.query(`
      UPDATE feedback 
      SET status = $1, handled_at = ${handled_at ? 'now()' : 'handled_at'}
      WHERE id = $2
      RETURNING id, status, handled_at
    `, [status, parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'feedback not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.listen(PORT, async () => {
  console.log(`server listening on :${PORT}`);
  
  // Initialize Prisma connection and log database info
  try {
    await logDbConnection();
  } catch (error) {
    console.error('[startup] Prisma database connection failed:', error.message);
    // Don't exit - allow fallback to existing db.js pool
  }
});


export default db