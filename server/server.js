import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const db = new Database('./data.db');
db.pragma('foreign_keys = ON');

function ensureTables() {
  db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('user','manager')) NOT NULL
);

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  manager_id INTEGER NOT NULL,
  FOREIGN KEY(manager_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_members (
  user_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, club_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_sports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  sport TEXT CHECK(sport IN ('tennis','basketball','football')) NOT NULL,
  courts INTEGER NOT NULL CHECK(courts > 0),
  open_hour INTEGER NOT NULL CHECK(open_hour BETWEEN 0 AND 23),
  close_hour INTEGER NOT NULL CHECK(close_hour BETWEEN 1 AND 24),
  slot_minutes INTEGER NOT NULL CHECK(slot_minutes IN (30, 60, 90, 120)),
  UNIQUE (club_id, sport),
  FOREIGN KEY(club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL,
  sport TEXT NOT NULL,
  court_index INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, sport, court_index, date, time),
  FOREIGN KEY(club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
  `);
}
ensureTables();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

// Create user profile
app.post('/users', (req, res) => {
  const { name, role } = req.body || {};
  if (!name || !role || !['user','manager'].includes(role)) {
    return res.status(400).json({ error: 'name and role (user|manager) required' });
  }
  const info = db.prepare('INSERT INTO users (name, role) VALUES (?, ?)').run(name, role);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json(user);
});

// Manager creates club (returns code)
app.post('/clubs', (req, res) => {
  const { name, managerId } = req.body || {};
  if (!name || !managerId) return res.status(400).json({ error: 'name and managerId required' });
  const manager = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(managerId, 'manager');
  if (!manager) return res.status(403).json({ error: 'managerId invalid or not a manager' });
  const code = nanoid();
  const info = db.prepare('INSERT INTO clubs (name, code, manager_id) VALUES (?, ?, ?)').run(name, code, managerId);
  // manager joins their own club
  db.prepare('INSERT OR IGNORE INTO club_members (user_id, club_id) VALUES (?, ?)').run(managerId, info.lastInsertRowid);
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(info.lastInsertRowid);
  res.json(club);
});

// Join club by code
app.post('/clubs/join', (req, res) => {
  const { code, userId } = req.body || {};
  if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });
  const club = db.prepare('SELECT * FROM clubs WHERE code = ?').get(code);
  if (!club) return res.status(404).json({ error: 'club not found' });
  db.prepare('INSERT OR IGNORE INTO club_members (user_id, club_id) VALUES (?, ?)').run(userId, club.id);
  res.json({ ok: true, club });
});

// Configure sport for a club
app.post('/clubs/:clubId/sports', (req, res) => {
  const clubId = Number(req.params.clubId);
  const { sport, courts, openHour, closeHour, slotMinutes, managerId } = req.body || {};
  if (!sport || !['tennis','basketball','football'].includes(sport)) {
    return res.status(400).json({ error: 'sport must be tennis|basketball|football' });
  }
  if (![30,60,90,120].includes(Number(slotMinutes))) {
    return res.status(400).json({ error: 'slotMinutes must be 30,60,90,120' });
  }
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
  if (!club) return res.status(404).json({ error: 'club not found' });
  if (club.manager_id !== Number(managerId)) return res.status(403).json({ error: 'only manager can configure' });

  const upsert = db.prepare(`
    INSERT INTO club_sports (club_id, sport, courts, open_hour, close_hour, slot_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(club_id, sport) DO UPDATE SET
      courts=excluded.courts,
      open_hour=excluded.open_hour,
      close_hour=excluded.close_hour,
      slot_minutes=excluded.slot_minutes
  `);
  upsert.run(clubId, sport, Number(courts), Number(openHour), Number(closeHour), Number(slotMinutes));
  const row = db.prepare('SELECT * FROM club_sports WHERE club_id=? AND sport=?').get(clubId, sport);
  res.json(row);
});

// List sports configured for a club
app.get('/clubs/:clubId/sports', (req, res) => {
  const clubId = Number(req.params.clubId);
  const rows = db.prepare('SELECT * FROM club_sports WHERE club_id=?').all(clubId);
  res.json(rows);
});

// Get availability grid for a date
app.get('/availability', (req, res) => {
  const clubId = Number(req.query.clubId);
  const sport = String(req.query.sport || '');
  const date = String(req.query.date || '');
  const userId = req.query.userId ? Number(req.query.userId) : null; // 👈 pass userId from client
  if (!clubId || !sport || !date) return res.status(400).json({ error: 'clubId, sport, date required' });

  const cfg = db.prepare('SELECT * FROM club_sports WHERE club_id=? AND sport=?').get(clubId, sport);
  if (!cfg) return res.status(404).json({ error: 'sport not configured for this club' });

  // build times
  const slots = [];
  const step = cfg.slot_minutes;
  for (let h = cfg.open_hour; h < cfg.close_hour; h += step / 60) {
    const hour = Math.floor(h);
    const minute = Math.round((h - hour) * 60);
    const time = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    slots.push(time);
  }

  // include user_id so frontend can color "yours" as orange
  const bookings = db.prepare(
    'SELECT id, court_index, time, user_id FROM bookings WHERE club_id=? AND sport=? AND date=?'
  ).all(clubId, sport, date);

  const bookedSet = new Set(bookings.map(b => `${b.court_index}@${b.time}`));
  const ownedSet  = userId != null
    ? new Set(bookings.filter(b => b.user_id === userId).map(b => `${b.court_index}@${b.time}`))
    : new Set();

  const idMap = new Map(bookings.map(b => [`${b.court_index}@${b.time}`, b.id]));

  const grid = slots.map(t => ({
    time: t,
    courts: Array.from({ length: cfg.courts }).map((_, idx) => {
      const key = `${idx}@${t}`;
      return {
        courtIndex: idx,
        booked: bookedSet.has(key),
        owned: ownedSet.has(key),
        bookingId: idMap.get(key) || null,
      };
    })
  }));

  res.json({ slots: grid, cfg });
});


// Book a slot
app.post('/book', (req, res) => {
  const { clubId, sport, courtIndex, date, time, userId } = req.body || {};
  if ([clubId, sport, courtIndex, date, time, userId].some(v => v === undefined)) {
    return res.status(400).json({ error: 'clubId, sport, courtIndex, date, time, userId required' });
  }

  // must be a club member
  const member = db.prepare('SELECT 1 FROM club_members WHERE user_id=? AND club_id=?').get(userId, clubId);
  if (!member) return res.status(403).json({ error: 'user not in club' });

  // enforce 1 active future booking (any sport) per user
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');
  const hh = String(today.getHours()).padStart(2,'0');
  const min = String(today.getMinutes()).padStart(2,'0');
  const curDate = `${yyyy}-${mm}-${dd}`;
  const curTime = `${hh}:${min}`;

  const hasActive = db.prepare(`
    SELECT 1 FROM bookings
    WHERE user_id = ?
      AND club_id = ?
      AND (date > ? OR (date = ? AND time >= ?))
    LIMIT 1
  `).get(userId, clubId, curDate, curDate, curTime);

  if (hasActive) {
    return res.status(409).json({ error: 'You already have an active booking. Cancel it or wait until it has passed.' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO bookings (club_id, sport, court_index, date, time, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(Number(clubId), sport, Number(courtIndex), date, time, Number(userId));
    const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(info.lastInsertRowid);
    res.json(booking);
  } catch (e) {
    if (String(e).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

app.post('/cancel', (req, res) => {
  const { bookingId, userId } = req.body || {};
  if (!bookingId || !userId) return res.status(400).json({ error: 'bookingId and userId required' });

  const row = db.prepare('SELECT * FROM bookings WHERE id=?').get(bookingId);
  if (!row) return res.status(404).json({ error: 'booking not found' });
  if (row.user_id !== Number(userId)) return res.status(403).json({ error: 'you can only cancel your own booking' });

  db.prepare('DELETE FROM bookings WHERE id=?').run(bookingId);
  res.json({ ok: true });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

