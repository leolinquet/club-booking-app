// server/server.js  (ESM version)
// Run with: PORT=5051 node server.js  (or npm run dev if your script calls node server.js)

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',                     // local Vite
    'https://club-booking-app-1.onrender.com'    // ← your Render Static Site URL
  ]
}));
app.use(express.json());

const DB_FILE = path.join(__dirname, 'data.db');
const db = new Database(DB_FILE);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique
  ON matches (tournament_id, round, slot);
`);

// Ensure only one (tournament_id, player_id) row exists
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_tp_unique
  ON tournament_players (tournament_id, player_id);
`);

function ensureSchema() {
  const tpCols = db.prepare(`PRAGMA table_info(tournament_players)`).all();
  if (!tpCols.some(c => c.name === 'seed')) {
    db.exec(`ALTER TABLE tournament_players ADD COLUMN seed INTEGER`);
  }

  const tCols = db.prepare(`PRAGMA table_info(tournaments)`).all();
  if (!tCols.some(c => c.name === 'seeds_count')) {
    db.exec(`ALTER TABLE tournaments ADD COLUMN seeds_count INTEGER DEFAULT 0`);
  }
}
ensureSchema();

// Ensure standings has points & tournaments_played
try {
  const sCols = new Set(db.prepare('PRAGMA table_info(standings)').all().map(c => c.name));
  if (!sCols.has('points')) {
    db.prepare(`ALTER TABLE standings ADD COLUMN points INTEGER DEFAULT 0`).run();
    console.log('Added standings.points column');
  }
  if (!sCols.has('tournaments_played')) {
    db.prepare(`ALTER TABLE standings ADD COLUMN tournaments_played INTEGER DEFAULT 0`).run();
    console.log('Added standings.tournaments_played column');
  }
} catch (e) {
  console.error('Could not ensure standings columns:', e.message);
}

// Ensure tournament_points has expected columns (round columns + finalist f, champion c)
try {
  const tpCols = new Set(db.prepare('PRAGMA table_info(tournament_points)').all().map(c => c.name));
  const need = ['r128','r64','r32','r16','qf','sf','f','c'];
  for (const col of need) {
    if (!tpCols.has(col)) {
      db.prepare(`ALTER TABLE tournament_points ADD COLUMN ${col} INTEGER DEFAULT 0`).run();
      console.log(`Added tournament_points.${col} column`);
    }
  }
  // we do NOT remove/alter existing 'round' if your table has it; we’ll just include it in inserts.
} catch (e) {
  console.error('Could not ensure tournament_points columns:', e.message);
}

// Points config per tournament + round (keeps your schema file unchanged)
db.prepare(`
  CREATE TABLE IF NOT EXISTS tournament_points (
    tournament_id INTEGER NOT NULL,
    round INTEGER NOT NULL,      -- 1=Final, 2=SF, 3=QF, ... (larger number = earlier round)
    points INTEGER NOT NULL,
    PRIMARY KEY (tournament_id, round),
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
  )
`).run();


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

// -------------------------------
// Auth
// -------------------------------
app.post('/auth/register', async (req, res) => {
  try {
    const { name, role, password } = req.body || {};
    if (!name || !role || !password) return res.status(400).json({ error: 'name, role, password required' });
    if (!['user', 'manager'].includes(role)) return res.status(400).json({ error: 'role must be user|manager' });

    const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
    if (existing) return res.status(409).json({ error: 'username already taken' });

    const password_hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (name, role, password_hash) VALUES (?, ?, ?)').run(name, role, password_hash);

    const user = db.prepare('SELECT id, name, role FROM users WHERE name = ?').get(name);
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const row = db.prepare('SELECT id, name, role, password_hash FROM users WHERE name = ?').get(name);
    if (!row) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    res.json({ id: row.id, name: row.name, role: row.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
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
function computeSeedingOrder({ clubId, sport, playerIds, seedCount }) {
  const rows = db.prepare(`
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
function buildSeededSlots({ playerIds, seedCount }) {
  const drawSize = nextPow2(playerIds.length);
  const { seeds, rest } = computeSeedingOrder({ clubId, sport, playerIds, seedCount });

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

// -------------------------------
// Tournaments & Rankings
// -------------------------------

// Create a single-elim tournament with per-round points config
// body: { name, sport, drawSize, seedCount, pointsByRound: { R128,R64,R32,R16,QF,SF,F } , managerId }
// Create a tournament (manager only) + store points config (finalist=f, champion=c)
app.post('/clubs/:clubId/tournaments', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { name, sport, drawSize, seedCount, pointsByRound, managerId } = req.body || {};

    // basic validation
    if (!name || !sport || !drawSize || !seedCount || !managerId) {
      return res.status(400).json({ error: 'missing fields' });
    }
    if (![4, 8, 16, 32, 64, 128].includes(Number(drawSize))) {
      return res.status(400).json({ error: 'drawSize must be 4,8,16,32,64,128' });
    }
    if (![2, 4, 8, 16, 32].includes(Number(seedCount))) {
      return res.status(400).json({ error: 'seedCount must be 2,4,8,16,32' });
    }

    // manager check
    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(clubId);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can create tournaments' });
    }

    // detect tournaments table columns
    const tCols = db.prepare('PRAGMA table_info(tournaments)').all().map(c => c.name);

    // build payload only with columns that exist (keeps changes minimal)
    const payload = {};
    if (tCols.includes('club_id'))     payload.club_id     = clubId;
    if (tCols.includes('sport'))       payload.sport       = String(sport);
    if (tCols.includes('name'))        payload.name        = String(name);
    if (tCols.includes('status'))      payload.status      = 'active';
    if (tCols.includes('format'))      payload.format      = 'single_elim';
    if (tCols.includes('start_date'))  payload.start_date  = null;
    if (tCols.includes('end_date'))    payload.end_date    = null;
    if (tCols.includes('block_courts'))payload.block_courts= 0;
    // optional config if your schema has them
    if (tCols.includes('draw_size'))   payload.draw_size   = Number(drawSize);
    if (tCols.includes('seed_count'))  payload.seed_count  = Number(seedCount);

    const keys = Object.keys(payload);
    if (!keys.length) {
      return res.status(500).json({ error: 'tournaments table has no compatible columns' });
    }

    // Duplicate guard (same club + sport + name)
    try {
      const dup = db
        .prepare('SELECT id FROM tournaments WHERE club_id=? AND sport=? AND name=?')
        .get(payload.club_id, payload.sport, payload.name);
      if (dup) {
        return res.status(409).json({ error: 'A tournament with this name and sport already exists for this club.' });
      }
    } catch (_e) {
      // If any of these columns don't exist in your schema, skip the guard.
    }

    const qMarks = keys.map(() => '?').join(', ');
    let info;
    try {
      info = db.prepare(
        `INSERT INTO tournaments (${keys.join(', ')}) VALUES (${qMarks})`
      ).run(...keys.map(k => payload[k]));
    } catch (e) {
      const msg = String(e && e.message || '');
      if (e && (e.code === 'SQLITE_CONSTRAINT_UNIQUE' || msg.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({ error: 'A tournament with this name and sport already exists for this club.' });
      }
      throw e; // bubble up unexpected errors
    }
    const tId = info.lastInsertRowid;


// --- points config → tournament_points ---------------------------------
(() => {
  const tpInfo = db.prepare('PRAGMA table_info(tournament_points)').all();
  const tpCols = tpInfo.map(c => c.name);

  if (!tpCols.includes('tournament_id')) {
    console.warn('[tournaments] tournament_points missing tournament_id column; skipping points seed');
    return;
  }

  const ptsIn = pointsByRound || {};
  const desired = {
    r128: Number(ptsIn.R128 || 0),
    r64:  Number(ptsIn.R64  || 0),
    r32:  Number(ptsIn.R32  || 0),
    r16:  Number(ptsIn.R16  || 0),
    qf:   Number(ptsIn.QF   || 0),
    sf:   Number(ptsIn.SF   || 0),
    f:    Number(ptsIn.F    || 0),
    c:    Number(ptsIn.C    || 0),
  };

  const hasPerRoundCols = ['r128','r64','r32','r16','qf','sf','f','c'].some(c => tpCols.includes(c));
  const hasRoundCol  = tpCols.includes('round');
  const hasPointsCol = tpCols.includes('points');

  try {
    if (hasPerRoundCols) {
      // (A) Wide schema → single row of per-round columns.
      const colNames = ['tournament_id'];
      const values   = [tId];

      if (hasRoundCol) { colNames.push('round'); values.push(0); }
      for (const [k, v] of Object.entries(desired)) {
        if (tpCols.includes(k)) { colNames.push(k); values.push(Number(v) || 0); }
      }
      // Some DBs also have an aggregate NOT NULL "points" alongside per-round cols → seed 0
      if (hasPointsCol) { colNames.push('points'); values.push(0); }

      const qMarks = colNames.map(() => '?').join(', ');
      db.prepare(
        `INSERT INTO tournament_points (${colNames.join(', ')}) VALUES (${qMarks})`
      ).run(...values);

    } else if (hasPointsCol && hasRoundCol) {
      // (B) Normalized rows → one row per round
      const ins = db.prepare(
        `INSERT INTO tournament_points (tournament_id, round, points) VALUES (?, ?, ?)`
      );
      const labelMap = { r128: 'R128', r64: 'R64', r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', f: 'F', c: 'C' };

      const tx = db.transaction((entries) => {
        for (const [col, pts] of entries) {
          const lbl = labelMap[col];
          if (!lbl) continue;
          ins.run(tId, lbl, Number(pts) || 0);
        }
      });
      tx(Object.entries(desired));

    } else if (hasPointsCol && !hasRoundCol) {
      // (C) Minimal aggregate → (tournament_id, points)
      const total = 0; // or sum of desired if you prefer
      db.prepare(
        `INSERT INTO tournament_points (tournament_id, points) VALUES (?, ?)`
      ).run(tId, total);

    } else {
      console.warn('[tournaments] tournament_points schema not recognized; skipping points seed');
    }
  } catch (e) {
    console.warn('[tournaments] failed to seed tournament_points:', e?.message || e);
  }
})();
// -----------------------------------------------------------------------


    res.json({
      ok: true,
      tournament: { id: tId, name: String(name), sport: String(sport) }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});


// body: { playerIds?: number[], userIds?: number[], managerId }
app.post('/tournaments/:id/players', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { userIds = [], usernames = [], managerId } = req.body || {};

    const t = db.prepare('SELECT id, club_id, sport, name FROM tournaments WHERE id=?').get(tId);
    if (!t) return res.status(404).json({ error: `tournament ${tId} not found in DB` });

    // only the club manager can add
    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can add players' });
    }

    // 1) resolve usernames -> user ids
    const ids = new Set(userIds.map(n => Number(n)).filter(Boolean));
    const notFound = [];
    for (const raw of usernames) {
      const name = String(raw).trim();
      if (!name) continue;
      const u = db.prepare('SELECT id, name FROM users WHERE name = ?').get(name);
      if (u) ids.add(u.id);
      else notFound.push(name);
    }
    if (ids.size === 0) {
      return res.status(400).json({ error: notFound.length ? `Users not found: ${notFound.join(', ')}` : 'No valid users found' });
    }

    // 2) ensure players row exists for this club+user, then insert that players.id
    for (const uid of ids) {
      // upsert into players (club-scoped identity). display_name defaults to users.name
      db.prepare(`
        INSERT OR IGNORE INTO players (club_id, user_id, display_name)
        SELECT ?, ?, name FROM users WHERE id = ?
      `).run(t.club_id, Number(uid), Number(uid));

      const p = db.prepare(`
        SELECT id FROM players WHERE club_id=? AND user_id=?
      `).get(t.club_id, Number(uid));

      if (!p) {
        // safety net: if user doesn’t exist, skip with message
        return res.status(400).json({ error: `No player entry could be created for user_id=${uid}` });
      }

      try {
        db.prepare(`
          INSERT OR IGNORE INTO tournament_players (tournament_id, player_id)
          VALUES (?, ?)
        `).run(tId, p.id);
      } catch (e) {
        console.error('Add player FK error', { tId, uid, playerId: p.id, tournament: t, msg: e.message });
        return res.status(500).json({ error: `FK failed for tournament_id=${tId}, player_id=${p.id}` });
      }
    }

    // return current list using players (and fallback to users.name)
    const current = db.prepare(`
      SELECT tp.player_id, COALESCE(p.display_name, u.name) AS display_name
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE tp.tournament_id=?
      ORDER BY display_name ASC
    `).all(tId);

    res.json({ players: current, notFound });
  } catch (e) {
    console.error('Error in /tournaments/:id/players:', e);
    res.status(500).json({ error: e.message || 'unexpected error' });
  }
});

// Auto-creates Round N matches with seeded placements.
// body: { drawSize, seedCount, managerId }
app.post('/tournaments/:id/generate', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { drawSize, seedCount, managerId } = req.body || {};

    const t = db.prepare('SELECT id, club_id, sport FROM tournaments WHERE id=?').get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can generate bracket' });
    }

    const N = Number(drawSize);
    if (![4,8,16,32,64,128].includes(N)) {
      return res.status(400).json({ error: 'drawSize must be 4,8,16,32,64,128' });
    }

    let S = Number(seedCount);
    if (!Number.isInteger(S) || S < 0) S = 0;
    S = Math.min(S, 32, N);

    // Entrants + standings points for ranking
    const entrants = db.prepare(`
      SELECT
        tp.player_id                                              AS player_id,
        COALESCE(p.display_name, u.name)                          AS display_name,
        COALESCE(s.points, 0)                                     AS pts
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN standings s
        ON s.player_id = tp.player_id AND s.club_id = ? AND s.sport = ?
      WHERE tp.tournament_id = ?
    `).all(t.club_id, t.sport, tId);

    if (entrants.length !== N) {
      return res.status(400).json({ error: `need exactly ${N} players; have ${entrants.length}` });
    }

    // Rank by points desc; stable tie-breakers by name then id
    const ranked = [...entrants].sort((a,b) =>
      b.pts - a.pts ||
      a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }) ||
      (a.player_id - b.player_id)
    );

    const seeds = ranked.slice(0, S).map(e => e.player_id);
    const rest  = ranked.slice(S).map(e => e.player_id);

    // Fisher–Yates shuffle for unseeded players
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    // Canonical bracket order: 1, N, N/4+1, ...
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

    const order = positions(N);          // e.g., N=4 -> [1,4,2,3]
    const slots = new Array(N).fill(0);  // sentinel 0 (player ids are >0)

    // Place seeds by seed index -> slot (so #2 goes to bottom)
    for (let i = 0; i < S; i++) {
      const slotIndex = order[i] - 1;
      slots[slotIndex] = seeds[i];
    }

    // Fill remaining with unseeded
    const empties = [];
    for (let i = 0; i < N; i++) if (!slots[i]) empties.push(i);
    if (empties.length !== rest.length) {
      console.error('Seeding mismatch', { N, S, empties: empties.length, rest: rest.length });
      return res.status(500).json({ error: `internal seeding error (need ${empties.length} unseeded, have ${rest.length})` });
    }
    for (let k = 0; k < empties.length; k++) slots[empties[k]] = rest[k];

    if (slots.some(v => !Number.isInteger(v))) {
      console.error('Slots still have non-integers:', slots);
      return res.status(500).json({ error: 'internal seeding error (missing player)' });
    }

    // Wipe old matches
    db.prepare('DELETE FROM matches WHERE tournament_id=?').run(tId);

    // Persist seeds so frontend can render them
    db.prepare(`UPDATE tournament_players SET seed = NULL WHERE tournament_id = ?`).run(tId);
    const setSeed = db.prepare(`
      UPDATE tournament_players SET seed = ? WHERE tournament_id = ? AND player_id = ?
    `);
    seeds.forEach((pid, idx) => setSeed.run(idx + 1, tId, pid)); // seeds 1..S

    // Verify we saved them
    const saved = db.prepare(`
      SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id=? AND seed IS NOT NULL
    `).get(tId).c;
    if (saved !== S) {
      console.error('Seed persist mismatch', { expected: S, saved });
      return res.status(500).json({ error: `internal seeding error (saved ${saved}/${S} seeds)` });
    }

    // Remember chosen seed count (optional)
    db.prepare(`UPDATE tournaments SET seeds_count = ? WHERE id = ?`).run(S, tId);

    // Insert first round
    const firstRound = Math.log2(N);
    const mCols = new Set(db.prepare('PRAGMA table_info(matches)').all().map(c => c.name));
    const insertSQL = mCols.has('status')
      ? `INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled')`
      : `INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`;
    const insertMatch = db.prepare(insertSQL);

    for (let s = 0; s < N / 2; s++) {
      insertMatch.run(tId, firstRound, s, slots[2*s], slots[2*s + 1]);
    }

    res.json({ ok: true, round: firstRound, matches: N / 2 });
  } catch (e) {
    console.error('Generate bracket error:', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.put('/matches/:id/result', (req, res) => {
  try {
    const mId = Number(req.params.id);
    const { managerId, p1_score, p2_score } = req.body || {};
    if (!managerId) return res.status(400).json({ error: 'managerId required' });

    const m = db.prepare('SELECT * FROM matches WHERE id=?').get(mId);
    if (!m) return res.status(404).json({ error: 'match not found' });

    const s1 = Number(p1_score);
    const s2 = Number(p2_score);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) return res.status(400).json({ error: 'invalid scores' });
    if (s1 === s2) return res.status(400).json({ error: 'scores must not tie' });

    const winnerId = s1 > s2 ? m.p1_id : m.p2_id;

    const mColsInfo = db.prepare('PRAGMA table_info(matches)').all();
    const mCols = new Set(mColsInfo.map(c => c.name));
    const notnull = Object.fromEntries(mColsInfo.map(c => [c.name, c.notnull]));

    const setParts = [];
    const vals = [];
    if (mCols.has('p1_score')) { setParts.push('p1_score=?'); vals.push(s1); }
    if (mCols.has('p2_score')) { setParts.push('p2_score=?'); vals.push(s2); }
    if (mCols.has('winner_id')) { setParts.push('winner_id=?'); vals.push(winnerId); }
    if (mCols.has('status')) setParts.push("status='completed'");
    if (mCols.has('updated_at')) setParts.push('updated_at=CURRENT_TIMESTAMP');
    if (!setParts.length) return res.status(500).json({ error: 'matches table missing expected columns' });
    db.prepare(`UPDATE matches SET ${setParts.join(', ')} WHERE id=?`).run(...vals, mId);

    const nextRound = Number(m.round) - 1;
    if (Number.isFinite(nextRound) && nextRound >= 1) {
      const hasNextMatchId = mCols.has('next_match_id');
      const hasNextSlot = mCols.has('next_slot');
      const hasP1Id = mCols.has('p1_id');
      const hasP2Id = mCols.has('p2_id');

      if (hasNextMatchId && hasNextSlot && hasP1Id && hasP2Id && m.next_match_id) {
        const slot = Number(m.next_slot) === 2 ? 2 : 1;
        const next = db.prepare('SELECT * FROM matches WHERE id=?').get(m.next_match_id);
        if (next) {
          const field = slot === 1 ? 'p1_id' : 'p2_id';
          if (next[field] == null) db.prepare(`UPDATE matches SET ${field}=? WHERE id=?`).run(winnerId, m.next_match_id);
        }
      } else {
        const nextSlot = Math.floor(Number(m.slot) / 2);
        let next = db.prepare('SELECT * FROM matches WHERE tournament_id=? AND round=? AND slot=?')
          .get(m.tournament_id, nextRound, nextSlot);

        const myField = (Number(m.slot) % 2 === 0) ? 'p1_id' : 'p2_id';
        const otherField = myField === 'p1_id' ? 'p2_id' : 'p1_id';
        const myNN = notnull[myField] === 1;
        const otherNN = notnull[otherField] === 1;

        if (!next) {
          const siblingSlot = (Number(m.slot) % 2 === 0) ? Number(m.slot) + 1 : Number(m.slot) - 1;
          const sibling = db.prepare('SELECT * FROM matches WHERE tournament_id=? AND round=? AND slot=?')
            .get(m.tournament_id, m.round, siblingSlot);
          const siblingWinner = sibling && Number(sibling.winner_id) ? Number(sibling.winner_id) : null;

          if (siblingWinner != null) {
            const p1 = myField === 'p1_id' ? winnerId : siblingWinner;
            const p2 = myField === 'p1_id' ? siblingWinner : winnerId;
            if (mCols.has('status')) {
              db.prepare(`INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status)
                          VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled')`)
                .run(m.tournament_id, nextRound, nextSlot, p1, p2);
            } else {
              db.prepare(`INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id)
                          VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`)
                .run(m.tournament_id, nextRound, nextSlot, p1, p2);
            }
          } else if (!myNN || !otherNN) {
            const p1 = myField === 'p1_id' ? winnerId : null;
            const p2 = myField === 'p1_id' ? null : winnerId;
            if (mCols.has('status')) {
              db.prepare(`INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status)
                          VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled')`)
                .run(m.tournament_id, nextRound, nextSlot, p1, p2);
            } else {
              db.prepare(`INSERT INTO matches (tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id)
                          VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`)
                .run(m.tournament_id, nextRound, nextSlot, p1, p2);
            }
          }
        } else {
          const field = myField;
          if (next[field] == null) db.prepare(`UPDATE matches SET ${field}=? WHERE id=?`).run(winnerId, next.id);
        }
      }
    } else {
      const tCols = new Set(db.prepare('PRAGMA table_info(tournaments)').all().map(c => c.name));
      const tParts = [];
      const tVals = [];
      if (tCols.has('status')) tParts.push("status=?"), tVals.push('completed');
      if (tCols.has('end_date')) tParts.push("end_date=COALESCE(end_date, datetime('now'))");
      if (tParts.length) db.prepare(`UPDATE tournaments SET ${tParts.join(', ')} WHERE id=?`).run(...tVals, m.tournament_id);
      awardTournamentPoints(m.tournament_id);
    }

    res.json({ ok: true, winner_id: winnerId });
  } catch (e) {
    console.error('Save result error:', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// List tournaments for a club (filter by status optional: 'active'|'completed')
app.get('/clubs/:clubId/tournaments', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { status } = req.query;
    let rows = db.prepare(`
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
app.get('/tournaments/:id', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const t = db.prepare('SELECT * FROM tournaments WHERE id=?').get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const points = db.prepare(`
      SELECT round, points FROM tournament_points WHERE tournament_id=?
    `).all(tId);

    // players: include tp.seed so the UI can render seed badges
    const players = db.prepare(`
      SELECT tp.player_id AS id,
            COALESCE(p.display_name, u.name) AS display_name,
            tp.seed
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE tp.tournament_id = ?
      ORDER BY (tp.seed IS NULL), tp.seed, display_name COLLATE NOCASE
    `).all(tId);

    // matches: fixed order (top→bottom) per round
    const matches = db.prepare(`
      SELECT id, tournament_id, round, slot, p1_id, p2_id,
            p1_score, p2_score, winner_id,
            COALESCE(status,'scheduled') AS status
      FROM matches
      WHERE tournament_id = ?
      ORDER BY round DESC, slot ASC
    `).all(tId);


    res.json({ tournament: t, points, players, matches });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Get standings (rankings) for a club
app.get('/clubs/:clubId/standings', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const rows = db.prepare(`
      SELECT
        s.player_id,
        COALESCE(p.display_name, u.name) AS name,
        s.played AS tournaments_played,    -- alias so UI matches
        s.points
      FROM standings s
      JOIN players p ON p.id = s.player_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE s.club_id = ?
      ORDER BY s.points DESC, name ASC
    `).all(clubId);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Reset all standings for a club (manager only). Body: { managerId, confirm: "reset" }
app.post('/clubs/:clubId/standings/reset', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { managerId, confirm } = req.body || {};
    if (confirm !== 'reset') {
      return res.status(400).json({ error: 'type "reset" to confirm' });
    }
    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(clubId);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can reset standings' });
    }

    // You asked to have "no players there anymore" after reset
    db.prepare(`DELETE FROM standings WHERE club_id=?`).run(clubId);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

function addStandingPoints(clubId, playerId, pts) {
  db.prepare(
    `INSERT OR IGNORE INTO standings (club_id, player_id, tournaments_played, points)
     VALUES (?, ?, 0, 0)`
  ).run(clubId, playerId);

  if (pts && pts > 0) {
    db.prepare(
      `UPDATE standings
       SET points = points + ?, tournaments_played = tournaments_played + 1
       WHERE club_id = ? AND player_id = ?`
    ).run(pts, clubId, playerId);
  } else {
    db.prepare(
      `UPDATE standings
       SET tournaments_played = tournaments_played + 1
       WHERE club_id = ? AND player_id = ?`
    ).run(clubId, playerId);
  }
}

function roundKeyForLoser(roundNum) {
  if (roundNum === 1) return 'f';
  if (roundNum === 2) return 'sf';
  if (roundNum === 3) return 'qf';
  const size = 1 << roundNum;
  return `r${size}`;
}

function loadPointsMap(tournamentId) {
  const info = db.prepare('PRAGMA table_info(tournament_points)').all();
  const cols = new Set(info.map(c => c.name));
  const keys = ['r128','r64','r32','r16','qf','sf','f','c'];
  const out = { r128:0, r64:0, r32:0, r16:0, qf:0, sf:0, f:0, c:0 };

  if (keys.some(k => cols.has(k))) {
    const row = db.prepare('SELECT * FROM tournament_points WHERE tournament_id=? ORDER BY rowid ASC LIMIT 1').get(tournamentId);
    if (row) for (const k of keys) out[k] = Number(row[k] || 0);
    if (cols.has('points') && out.c === 0 && row && row.points != null) out.c = Number(row.points) || 0;
    return out;
  }

  if (cols.has('round') && cols.has('points')) {
    const rows = db.prepare('SELECT round, points FROM tournament_points WHERE tournament_id=?').all(tournamentId);
    for (const r of rows) {
      const val = Number(r.points) || 0;
      const tag = String(r.round).toUpperCase();
      if (tag === 'C') out.c = val;
      else if (tag === 'F') out.f = val;
      else if (tag === 'SF') out.sf = val;
      else if (tag === 'QF') out.qf = val;
      else if (tag.startsWith('R')) {
        const n = parseInt(tag.slice(1), 10);
        if (n === 128) out.r128 = val;
        else if (n === 64) out.r64 = val;
        else if (n === 32) out.r32 = val;
        else if (n === 16) out.r16 = val;
      } else {
        const n = Number(tag);
        if (n === 1) out.f = val;
        else if (n === 2) out.sf = val;
        else if (n === 3) out.qf = val;
        else if (n >= 4) out[`r${1 << n}`] = val;
      }
    }
    return out;
  }

  if (cols.has('points') && !cols.has('round')) {
    const row = db.prepare('SELECT points FROM tournament_points WHERE tournament_id=? ORDER BY rowid ASC LIMIT 1').get(tournamentId);
    if (row) out.c = Number(row.points) || 0;
    return out;
  }

  return out;
}

function awardTournamentPoints(tournamentId) {
  // 1) Load tournament context (no draw_size)
  const t = db.prepare(`
    SELECT t.id, t.club_id, t.sport
    FROM tournaments t
    WHERE t.id = ?
  `).get(tournamentId);
  if (!t) return;

  // 2) Read points per round (supports wide or normalized tournament_points schema)
  let pts = { R128:0, R64:0, R32:0, R16:0, QF:0, SF:0, F:0, C:0 };

  const tpCols = db.prepare('PRAGMA table_info(tournament_points)').all().map(c => c.name);
  if (['r128','r64','r32','r16','qf','sf','f','c'].some(c => tpCols.includes(c))) {
    const row = db.prepare(`
      SELECT r128, r64, r32, r16, qf, sf, f, c
      FROM tournament_points WHERE tournament_id = ?
    `).get(tournamentId) || {};
    pts.R128 = Number(row.r128 || 0);
    pts.R64  = Number(row.r64  || 0);
    pts.R32  = Number(row.r32  || 0);
    pts.R16  = Number(row.r16  || 0);
    pts.QF   = Number(row.qf   || 0);
    pts.SF   = Number(row.sf   || 0);
    pts.F    = Number(row.f    || 0);
    pts.C    = Number(row.c    || 0);
  } else if (tpCols.includes('round') && tpCols.includes('points')) {
    const rows = db.prepare(`
      SELECT round, points FROM tournament_points WHERE tournament_id = ?
    `).all(tournamentId);
    for (const r of rows) {
      const key = String(r.round).toUpperCase(); // 'R32','SF','F','C'
      if (key in pts) pts[key] = Number(r.points || 0);
    }
  } // else: keep defaults (0s)

  // 3) Completed matches → losers' points + champion's C
  const matches = db.prepare(`
    SELECT id, round, slot, p1_id, p2_id, winner_id
    FROM matches
    WHERE tournament_id = ? AND winner_id IS NOT NULL
  `).all(tournamentId);

  const agg = new Map();
  const add = (pid, deltaPts, playedFlag=0) => {
    if (!pid) return;
    const cur = agg.get(pid) || { points:0, played:0 };
    cur.points += Number(deltaPts || 0);
    cur.played = Math.max(cur.played, playedFlag ? 1 : 0);
    agg.set(pid, cur);
  };

  // Round number → label (no draw_size fallback needed)
  const labelForRound = (roundNum) => {
    switch (Number(roundNum)) {
      case 1: return 'F';
      case 2: return 'SF';
      case 3: return 'QF';
      case 4: return 'R16';
      case 5: return 'R32';
      case 6: return 'R64';
      case 7: return 'R128';
      default: return 'F';
    }
  };

  for (const m of matches) {
    // mark participation
    add(m.p1_id, 0, 1);
    add(m.p2_id, 0, 1);

    const loser = Number(m.winner_id) === Number(m.p1_id) ? m.p2_id : m.p1_id;
    const lbl = labelForRound(m.round);
    add(loser, pts[lbl] || 0, 1);
  }

  // champion = winner of final
  const final = matches.find(x => Number(x.round) === 1);
  if (final?.winner_id) add(final.winner_id, pts.C || 0, 1);

  // 4) Upsert into your standings schema (played/points columns)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS standings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      sport TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      season TEXT DEFAULT 'default',
      played INTEGER NOT NULL DEFAULT 0,
      won INTEGER NOT NULL DEFAULT 0,
      drawn INTEGER NOT NULL DEFAULT 0,
      lost INTEGER NOT NULL DEFAULT 0,
      gf INTEGER NOT NULL DEFAULT 0,
      ga INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      rating INTEGER,
      UNIQUE (club_id, sport, season, player_id)
    )
  `).run();

  const upsert = db.prepare(`
    INSERT INTO standings (club_id, sport, player_id, season, played, points)
    VALUES (?, ?, ?, 'default', ?, ?)
    ON CONFLICT (club_id, sport, season, player_id)
    DO UPDATE SET
      played = played + excluded.played,
      points = points + excluded.points
  `);

  const tx = db.transaction((entries) => {
    for (const [pid, v] of entries) {
      upsert.run(t.club_id, t.sport, pid, v.played, v.points);
    }
  });
  tx(agg.entries());
}

// GET /tournaments/:id/joined?userId=123
app.get('/tournaments/:id/joined', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ joined: false });

    const t = db.prepare(`SELECT id, club_id FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    // find or create the player's club profile
    let player = db.prepare(`SELECT id FROM players WHERE club_id=? AND user_id=?`)
      .get(t.club_id, userId);

    if (!player) return res.json({ joined: false });

    const row = db.prepare(`
      SELECT 1 FROM tournament_players WHERE tournament_id=? AND player_id=? LIMIT 1
    `).get(tId, player.id);

    res.json({ joined: !!row });
  } catch (e) {
    console.error('joined error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// POST /tournaments/:id/signin  { userId }
app.post('/tournaments/:id/signin', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const t = db.prepare(`SELECT id, club_id, end_date FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const hasMatches = db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE tournament_id=?`).get(tId).c > 0;
    if (hasMatches) return res.status(400).json({ error: 'sign-ups are closed (draw already generated)' });
    if (t.end_date) return res.status(400).json({ error: 'tournament is completed' });

    // find or create player profile in this club
    let player = db.prepare(`SELECT id FROM players WHERE club_id=? AND user_id=?`)
      .get(t.club_id, Number(userId));
    if (!player) {
      const u = db.prepare(`SELECT name FROM users WHERE id=?`).get(Number(userId));
      const pCols = new Set(db.prepare(`PRAGMA table_info(players)`).all().map(c => c.name));
      const ins = pCols.has('display_name')
        ? db.prepare(`INSERT INTO players (club_id, user_id, display_name) VALUES (?, ?, ?)`)
        : db.prepare(`INSERT INTO players (club_id, user_id) VALUES (?, ?)`);

      const result = pCols.has('display_name')
        ? ins.run(t.club_id, Number(userId), u?.name ?? `user${userId}`)
        : ins.run(t.club_id, Number(userId));
      player = { id: Number(result.lastInsertRowid) };
    }

    // add to tournament
    db.prepare(`
      INSERT OR IGNORE INTO tournament_players (tournament_id, player_id) VALUES (?, ?)
    `).run(tId, player.id);

    res.json({ ok: true });
  } catch (e) {
    console.error('signin error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// DELETE /tournaments/:id/signin  { userId }
app.delete('/tournaments/:id/signin', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const t = db.prepare(`SELECT id, club_id FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    const hasMatches = db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE tournament_id=?`).get(tId).c > 0;
    if (hasMatches) return res.status(400).json({ error: 'cannot withdraw (draw already generated)' });

    const player = db.prepare(`SELECT id FROM players WHERE club_id=? AND user_id=?`)
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

// DELETE /tournaments/:id/players/:playerId?managerId=999
app.delete('/tournaments/:id/players/:playerId', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const playerId = Number(req.params.playerId);
    const managerId = Number(req.query.managerId);

    const t = db.prepare(`SELECT id, club_id FROM tournaments WHERE id=?`).get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });
    const clubRow = db.prepare(`SELECT manager_id FROM clubs WHERE id=?`).get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== managerId) {
      return res.status(403).json({ error: 'only club manager can modify entrants' });
    }

    const hasMatches = db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE tournament_id=?`).get(tId).c > 0;
    if (hasMatches) return res.status(400).json({ error: 'cannot remove after draw is generated' });

    db.prepare(`DELETE FROM tournament_players WHERE tournament_id=? AND player_id=?`).run(tId, playerId);
    res.json({ ok: true });
  } catch (e) {
    console.error('remove entrant error', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Clubs & Membership
// -------------------------------
app.post('/clubs', (req, res) => {
  try {
    const { name, managerId } = req.body || {};
    if (!name || !managerId) return res.status(400).json({ error: 'name, managerId required' });

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const info = db.prepare('INSERT INTO clubs (name, code, manager_id) VALUES (?, ?, ?)')
      .run(name, code, Number(managerId));

    db.prepare('INSERT OR IGNORE INTO club_members (user_id, club_id) VALUES (?, ?)')
      .run(Number(managerId), info.lastInsertRowid);

    const club = db.prepare('SELECT id, name, code, manager_id FROM clubs WHERE id = ?')
      .get(info.lastInsertRowid);
    res.json(club);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.post('/clubs/join', (req, res) => {
  try {
    const { code, userId } = req.body || {};
    if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });

    const club = db.prepare('SELECT id, name, code, manager_id FROM clubs WHERE code = ?').get(code);
    if (!club) return res.status(404).json({ error: 'club not found' });

    db.prepare('INSERT OR IGNORE INTO club_members (user_id, club_id) VALUES (?, ?)').run(Number(userId), club.id);
    res.json({ club });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.get('/users/:id/club', (req, res) => {
  try {
    const { id } = req.params;
    const club = db.prepare(`
      SELECT c.id, c.name, c.code, c.manager_id
      FROM clubs c
      JOIN club_members m ON m.club_id = c.id
      WHERE m.user_id = ?
      ORDER BY c.id ASC
      LIMIT 1
    `).get(Number(id));
    if (!club) return res.status(404).json({ error: 'no club' });
    res.json(club);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.get('/users/:id/clubs', (req, res) => {
  try {
    const { id } = req.params;
    const rows = db.prepare(`
      SELECT c.id, c.name, c.code, c.manager_id
      FROM clubs c
      JOIN club_members m ON m.club_id = c.id
      WHERE m.user_id = ?
      ORDER BY c.id ASC
    `).all(Number(id));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Club Sports CRUD
// -------------------------------
app.get('/clubs/:clubId/sports', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const rows = db.prepare('SELECT * FROM club_sports WHERE club_id = ? ORDER BY id ASC').all(clubId);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.post('/clubs/:clubId/sports', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { sport, courts, openHour, closeHour, slotMinutes, managerId } = req.body || {};
    if (!sport || !courts || openHour == null || closeHour == null || !slotMinutes || !managerId) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const row = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
    if (!row || Number(row.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can modify sports' });
    }

    db.prepare(`
      INSERT INTO club_sports (club_id, sport, courts, open_hour, close_hour, slot_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clubId, String(sport), Number(courts), Number(openHour), Number(closeHour), Number(slotMinutes));

    const created = db.prepare('SELECT * FROM club_sports WHERE club_id = ? AND sport = ?').get(clubId, String(sport));
    res.json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.put('/clubs/:clubId/sports/:id', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const id = Number(req.params.id);
    const { sport, courts, openHour, closeHour, slotMinutes, managerId } = req.body || {};

    const row = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
    if (!row || Number(row.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can modify sports' });
    }

    db.prepare(`
      UPDATE club_sports
      SET sport = ?, courts = ?, open_hour = ?, close_hour = ?, slot_minutes = ?
      WHERE id = ? AND club_id = ?
    `).run(String(sport), Number(courts), Number(openHour), Number(closeHour), Number(slotMinutes), id, clubId);

    const updated = db.prepare('SELECT * FROM club_sports WHERE id = ?').get(id);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.delete('/clubs/:clubId/sports/:id', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const id = Number(req.params.id);
    const { managerId } = req.body || {};

    const row = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
    if (!row || Number(row.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can delete sports' });
    }

    db.prepare('DELETE FROM club_sports WHERE id = ? AND club_id = ?').run(id, clubId);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Availability grid
// -------------------------------
app.get('/availability', (req, res) => {
  try {
    const clubId = Number(req.query.clubId);
    const sport = String(req.query.sport || '');
    const date = String(req.query.date || '');
    const userId = req.query.userId ? Number(req.query.userId) : null;

    const cfg = db.prepare('SELECT * FROM club_sports WHERE club_id=? AND sport=?').get(clubId, sport);
    if (!cfg) return res.status(404).json({ error: 'sport not configured for this club' });

    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
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

    const bookings = db.prepare(`
      SELECT b.id, b.court_index, b.time, b.user_id, u.name AS booked_by
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.club_id=? AND b.sport=? AND b.date=?
    `).all(clubId, sport, date);

    const bookedSet = new Set(bookings.map(b => `${b.court_index}@${b.time}`));
    const ownedSet = userId != null
      ? new Set(bookings.filter(b => b.user_id === userId).map(b => `${b.court_index}@${b.time}`))
      : new Set();
    const idMap = new Map(bookings.map(b => [`${b.court_index}@${b.time}`, b.id]));
    const nameMap = new Map(bookings.map(b => [`${b.court_index}@${b.time}`, b.booked_by || null]));

    const grid = times.map(t => ({
      time: t,
      courts: Array.from({ length: Number(cfg.courts) }).map((_, idx) => {
        const key = `${idx}@${t}`;
        return {
          courtIndex: idx,
          booked: bookedSet.has(key),
          owned: ownedSet.has(key),
          bookingId: idMap.get(key) || null,
          ...(isOwnClubManager && bookedSet.has(key) ? { bookedBy: nameMap.get(key) || null } : {})
        };
      })
    }));

    res.json({ cfg: { courts: Number(cfg.courts) }, slots: grid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Book / Cancel
// -------------------------------
app.post('/book', (req, res) => {
  try {
    const { clubId, sport, courtIndex, date, time, userId, asUsername } = req.body || {};
    if (clubId == null || !sport || courtIndex == null || !date || !time || userId == null) {
      return res.status(400).json({ error: 'missing fields' });
    }

    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(Number(clubId));
    const isOwnClubManager = clubRow && Number(clubRow.manager_id) === Number(userId);

    let targetUserId = Number(userId);
    if (asUsername !== undefined && asUsername !== null) {
      if (!isOwnClubManager) {
        return res.status(403).json({ error: 'Only the club manager can assign bookings to other users.' });
      }
      const u = db.prepare('SELECT id FROM users WHERE name = ?').get(String(asUsername).trim());
      if (!u) return res.status(400).json({ error: 'User not found' });
      targetUserId = u.id;
    }

    // enforce "1 active booking" for regular users only
    const { date: curDate, time: curTime } = nowDateTime();
    const hasActive = db.prepare(`
      SELECT 1 FROM bookings
      WHERE user_id = ?
        AND club_id = ?
        AND (date > ? OR (date = ? AND time >= ?))
      LIMIT 1
    `).get(Number(targetUserId), Number(clubId), curDate, curDate, curTime);
    if (!isOwnClubManager && hasActive) {
      return res.status(409).json({ error: 'You already have an active booking. Cancel it or wait until it has passed.' });
    }

    const dup = db.prepare(`
      SELECT 1 FROM bookings
      WHERE club_id = ? AND sport = ? AND court_index = ? AND date = ? AND time = ?
      LIMIT 1
    `).get(Number(clubId), String(sport), Number(courtIndex), String(date), String(time));
    if (dup) return res.status(409).json({ error: 'slot already booked' });

    db.prepare(`
      INSERT INTO bookings (club_id, sport, court_index, date, time, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(Number(clubId), String(sport), Number(courtIndex), String(date), String(time), Number(targetUserId));

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    if (String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'slot already booked' });
    }
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.post('/cancel', (req, res) => {
  try {
    const { bookingId, userId } = req.body || {};
    if (bookingId == null || userId == null) return res.status(400).json({ error: 'bookingId, userId required' });

    const row = db.prepare('SELECT club_id, user_id FROM bookings WHERE id = ?').get(Number(bookingId));
    if (!row) return res.status(404).json({ error: 'booking not found' });

    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(Number(row.club_id));
    const managerId = clubRow ? Number(clubRow.manager_id) : null;

    const isOwner = Number(row.user_id) === Number(userId);
    const isManager = managerId === Number(userId);

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: 'not allowed' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(Number(bookingId));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// -------------------------------
// Server
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server listening on :${PORT}`);
});
