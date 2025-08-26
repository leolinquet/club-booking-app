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
