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
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'data.db');
const db = new Database(DB_FILE);
db.pragma('foreign_keys = ON');

try {
  const cols = db.prepare('PRAGMA table_info(matches)').all().map(c => c.name);
  if (!cols.includes('slot')) {
    db.prepare('ALTER TABLE matches ADD COLUMN slot INTEGER').run();
    console.log('Added matches.slot column');
  }
} catch (e) {
  console.error('Error ensuring matches.slot column:', e.message);
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

// Given standings points, compute seeds: top N are seeds, remainder shuffled.
function computeSeedingOrder({ clubId, sport, playerIds, seedCount }) {
  // pull current standings points (higher first)
  const rows = db.prepare(`
    SELECT p.id as player_id, s.points as pts
    FROM players p
    LEFT JOIN standings s
      ON s.player_id = p.id AND s.club_id = p.club_id AND s.sport = ?
    WHERE p.club_id = ? AND p.id IN (${playerIds.map(()=>'?').join(',')})
  `).all(sport, clubId, ...playerIds);

  const ptsMap = new Map(rows.map(r => [r.player_id, r.pts || 0]));
  const withPts = [...playerIds].map(pid => ({ pid, pts: ptsMap.get(pid) || 0 }));

  // sort desc by points
  withPts.sort((a,b)=> b.pts - a.pts);

  const seeds = withPts.slice(0, seedCount).map(r => r.pid);
  const rest  = withPts.slice(seedCount).map(r => r.pid);

  // shuffle rest (simple Fisher–Yates)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()* (i+1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  return { seeds, rest };
}

// Place seeds in standard single-elim positions for fairness.
// This places #1 top, #2 bottom, #3/#4 in opposite quarters, etc., for the first round.
function seedPositions(drawSize, seedCount) {
  // Basic canonical mapping for seed slots in a power-of-two draw.
  // We’ll fill: 1->1, 2->drawSize, 3->drawSize/4+1, 4->(3 quarters) drawSize*3/4,
  // then pairwise scattering for 5-8, etc. Minimal but acceptable for now.
  const slots = new Array(drawSize).fill(null);

  const place = (seed, index) => { slots[index] = seed; };

  if (seedCount >= 1) place(1, 0);
  if (seedCount >= 2) place(2, drawSize - 1);
  if (seedCount >= 3) place(3, Math.floor(drawSize/4));
  if (seedCount >= 4) place(4, Math.floor(drawSize*3/4) - 1);

  const bucketPairs = [
    [Math.floor(drawSize/8), Math.floor(drawSize*7/8) - 1], // seeds 5-6
    [Math.floor(drawSize*3/8), Math.floor(drawSize*5/8) - 1], // 7-8
    [Math.floor(drawSize/16), Math.floor(drawSize*15/16) - 1], // 9-10
    [Math.floor(drawSize*5/16), Math.floor(drawSize*11/16) - 1], // 11-12
    [Math.floor(drawSize*7/16), Math.floor(drawSize*9/16) - 1], // 13-14
    [Math.floor(drawSize*1/16*3), Math.floor(drawSize*13/16) - 1], // 15-16 (rough)
  ];

  let s = 5;
  for (const [a,b] of bucketPairs) {
    if (s > seedCount) break;
    place(s++, a);
    if (s > seedCount) break;
    place(s++, b);
  }

  return slots;
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
app.post('/clubs/:clubId/tournaments', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const { name, sport, drawSize, seedCount, pointsByRound, managerId } = req.body || {};

    // basic validation
    if (!name || !sport || !drawSize || !seedCount || !managerId) {
      return res.status(400).json({ error: 'missing fields' });
    }
    if (![4,8,16,32,64,128].includes(Number(drawSize))) {
      return res.status(400).json({ error: 'drawSize must be 4,8,16,32,64,128' });
    }
    if (![2,4,8,16,32].includes(Number(seedCount))) {
      return res.status(400).json({ error: 'seedCount must be 2,4,8,16,32' });
    }

    // manager check
    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(clubId);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can create tournaments' });
    }

    // detect tournaments table columns
    const cols = db.prepare(`PRAGMA table_info(tournaments)`).all().map(c => c.name);

    // always include these if present
    const payload = {};
    if (cols.includes('club_id')) payload.club_id = clubId;
    if (cols.includes('sport'))   payload.sport   = String(sport);
    if (cols.includes('name'))    payload.name    = String(name);

    // optional columns (only set if they exist)
    if (cols.includes('format'))       payload.format       = 'single_elim';
    if (cols.includes('status'))       payload.status       = 'active';
    if (cols.includes('start_date'))   payload.start_date   = null;
    if (cols.includes('end_date'))     payload.end_date     = null;
    if (cols.includes('block_courts')) payload.block_courts = 0;

    // build dynamic insert
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      return res.status(500).json({ error: 'tournaments table has no compatible columns' });
    }
    const placeholders = keys.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO tournaments (${keys.join(', ')}) VALUES (${placeholders})`);
    const info = stmt.run(...keys.map(k => payload[k]));
    const tId = info.lastInsertRowid;

    // points config → tournament_points (we created this table at boot)
    const rounds = canonicalRounds(Number(drawSize));
    for (const r of rounds) {
      const pts = pointsByRound?.[r.label] ?? 0;
      db.prepare(`
        INSERT INTO tournament_points (tournament_id, round, points)
        VALUES (?, ?, ?)
      `).run(tId, r.round, Number(pts));
    }

    // response mirrors what the UI needs
    res.json({
      id: tId,
      club_id: clubId,
      sport: String(sport),
      name: String(name),
      format: payload.format || 'single_elim',
      drawSize: Number(drawSize),
      seedCount: Number(seedCount)
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

// body: { drawSize, seedCount, managerId }
// Auto-creates Round N matches with seeded placements.
// Build single-elim bracket (snake seeding). Round numbering: 1=Final, 2=SF, 3=QF, ...
// Build single-elim bracket (snake seeding). Round: 1=Final, 2=SF, 3=QF, ... first round = log2(N)
app.post('/tournaments/:id/generate', (req, res) => {
  try {
    const tId = Number(req.params.id);
    const { drawSize, seedCount, managerId } = req.body || {};

    // Validate tournament
    const t = db.prepare('SELECT id, club_id FROM tournaments WHERE id=?').get(tId);
    if (!t) return res.status(404).json({ error: 'tournament not found' });

    // Only club manager can generate
    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id=?').get(t.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can generate bracket' });
    }

    const N = Number(drawSize);
    const S = Number(seedCount);

    if (![4,8,16,32,64,128].includes(N)) {
      return res.status(400).json({ error: 'drawSize must be one of 4,8,16,32,64,128' });
    }
    if (![2,4,8,16,32].includes(S) || S > N) {
      return res.status(400).json({ error: 'seedCount must be 2,4,8,16,32 and ≤ drawSize' });
    }

    // Pull entrants added to this tournament (players are club-scoped; show nice names)
    const entrants = db.prepare(`
      SELECT tp.player_id, COALESCE(p.display_name, u.name) AS display_name
      FROM tournament_players tp
      JOIN players p ON p.id = tp.player_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE tp.tournament_id=?
      ORDER BY display_name COLLATE NOCASE ASC
    `).all(tId);

    if (entrants.length !== N) {
      return res.status(400).json({ error: `need exactly ${N} players; have ${entrants.length}` });
    }

    // Top S are seeds by current order; rest are unseeded
    const seeds = entrants.slice(0, S).map(e => e.player_id);
    const rest  = entrants.slice(S).map(e => e.player_id);

    // Deterministic shuffle of unseeded so order is stable
    for (let i = 0; i < rest.length - 1; i++) {
      const j = (rest[i] + i * 31) % (rest.length - i) + i;
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    // Snake seeding positions for 1..N (e.g., 8 -> [1,8,4,5,3,6,2,7])
    const positions = (size) => {
      const build = (n) => {
        if (n === 2) return [1, 2];
        const prev = build(n / 2);
        const out = [];
        for (let i = 0; i < prev.length; i++) {
          out.push(prev[i]);
          out.push(n + 1 - prev[i]);
        }
        return out;
      };
      return build(size);
    };
    const snake = positions(N);

    // Fill bracket slots 0..N-1: seed numbers go in; others filled from rest[]
    const slots = new Array(N).fill(null);
    for (let i = 0; i < N; i++) {
      const seedNo = snake[i];
      if (seedNo <= S) slots[i] = seeds[seedNo - 1];
    }
    let rIdx = 0;
    for (let i = 0; i < N; i++) if (slots[i] == null) slots[i] = rest[rIdx++];

    if (slots.some(v => v == null)) {
      return res.status(500).json({ error: 'internal seeding error (missing player)' });
    }

    // Wipe old matches for this tournament
    db.prepare('DELETE FROM matches WHERE tournament_id=?').run(tId);

    // Insert ONLY the first round; later rounds are created when both feeder matches finish
    const firstRound = Math.log2(N);

    // EXACTLY 5 placeholders (tId, round, slot, p1_id, p2_id). Others are constants.
    const insertMatch = db.prepare(`
      INSERT INTO matches (
        tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status
      )
      VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled')
    `);

    for (let s = 0; s < N / 2; s++) {
      const p1 = slots[2 * s];
      const p2 = slots[2 * s + 1];
      if (p1 == null || p2 == null) {
        return res.status(500).json({ error: `internal seeding error (missing player in pair ${s})` });
      }
      insertMatch.run(tId, firstRound, s, p1, p2);
    }

    res.json({ ok: true, round: firstRound, matches: N / 2 });
  } catch (e) {
    console.error('Generate bracket error:', e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Save result, auto-advance only when both feeder matches are completed
app.put('/matches/:id/result', (req, res) => {
  try {
    const mId = Number(req.params.id);
    const { p1_score, p2_score, managerId } = req.body || {};

    // Load match + club (for manager check)
    const m = db.prepare(`
      SELECT m.id, m.tournament_id, m.round, m.slot, m.p1_id, m.p2_id, t.club_id
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = ?
    `).get(mId);

    if (!m) return res.status(404).json({ error: 'match not found' });

    // Only the club's manager can report results
    const clubRow = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(m.club_id);
    if (!clubRow || Number(clubRow.manager_id) !== Number(managerId)) {
      return res.status(403).json({ error: 'only club manager can report results' });
    }

    // Guard: this match must have both players (schema has NOT NULL p1_id/p2_id)
    if (!m.p1_id || !m.p2_id) {
      return res.status(500).json({ error: 'cannot save result: match has missing players' });
    }

    const s1 = Number(p1_score) || 0;
    const s2 = Number(p2_score) || 0;
    if (s1 === s2) return res.status(400).json({ error: 'scores must not tie' });

    const winner = s1 > s2 ? m.p1_id : m.p2_id;

    // Update current match
    db.prepare(`
      UPDATE matches
      SET p1_score = ?, p2_score = ?, winner_id = ?, status = 'completed'
      WHERE id = ?
    `).run(s1, s2, winner, mId);

    // If this was the final, we're done
    if (m.round === 1) {
      return res.json({ ok: true, final: true });
    }

    // Need sibling match in same round, by slot
    if (m.slot == null) {
      // This should never happen for newly generated brackets; prevents bad inserts.
      return res.json({ ok: true, progressed: false, note: 'no slot set on match; cannot pair winners' });
    }

    const siblingSlot = (m.slot % 2 === 0) ? m.slot + 1 : m.slot - 1;
    const sibling = db.prepare(`
      SELECT id, winner_id
      FROM matches
      WHERE tournament_id = ? AND round = ? AND slot = ?
    `).get(m.tournament_id, m.round, siblingSlot);

    // If sibling not found or not completed yet → stop here (no partial next match)
    if (!sibling || !sibling.winner_id) {
      return res.json({ ok: true, progressed: false });
    }

    // Both winners known → create next-round match at nextSlot if it doesn't exist
    const nextRound = m.round - 1;
    const nextSlot  = Math.floor(m.slot / 2);

    const existing = db.prepare(`
      SELECT id FROM matches
      WHERE tournament_id = ? AND round = ? AND slot = ?
    `).get(m.tournament_id, nextRound, nextSlot);

    if (!existing) {
      // Order winners consistently so each feeder supplies the right side:
      // even slot feeds as p1; odd slot feeds as p2
      const p1 = (m.slot % 2 === 0) ? winner : sibling.winner_id;
      const p2 = (m.slot % 2 === 0) ? sibling.winner_id : winner;

      if (!p1 || !p2) {
        return res.status(500).json({ error: 'auto-advance pairing error (missing winner)' });
      }

      db.prepare(`
        INSERT INTO matches (
          tournament_id, round, slot, p1_id, p2_id, p1_score, p2_score, winner_id, status
        )
        VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'scheduled')
      `).run(m.tournament_id, nextRound, nextSlot, Number(p1), Number(p2));
    }

    res.json({ ok: true, progressed: true });
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

    const players = db.prepare(`
      SELECT p.id, p.display_name
      FROM tournament_players tp
      JOIN players p ON p.id=tp.player_id
      WHERE tp.tournament_id=?
    `).all(tId);

    const matches = db.prepare(`
      SELECT * FROM matches WHERE tournament_id=? ORDER BY round DESC, id ASC
    `).all(tId);

    res.json({ tournament: t, points, players, matches });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Rankings table for a club & sport
app.get('/clubs/:clubId/standings', (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const sport = String(req.query.sport || '');
    if (!sport) return res.status(400).json({ error: 'sport required' });

    const rows = db.prepare(`
      SELECT s.player_id, s.points, COALESCE(p.display_name, 'Unknown') AS name,
             s.played, s.won, s.drawn, s.lost
      FROM standings s
      LEFT JOIN players p ON p.id = s.player_id
      WHERE s.club_id=? AND s.sport=? AND s.season='default'
      ORDER BY s.points DESC, name ASC
    `).all(clubId, sport);

    // optional: tournaments played (count of unique tournaments the player appeared in)
    const playedCounts = db.prepare(`
      SELECT tp.player_id, COUNT(DISTINCT t.id) AS tcount
      FROM tournament_players tp
      JOIN tournaments t ON t.id = tp.tournament_id
      WHERE t.club_id=? AND t.sport=?
      GROUP BY tp.player_id
    `).all(clubId, sport);
    const tCount = new Map(playedCounts.map(r => [r.player_id, r.tcount]));

    const result = rows.map(r => ({
      player_id: r.player_id,
      name: r.name,
      tournaments_played: tCount.get(r.player_id) || 0,
      points: r.points
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
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
