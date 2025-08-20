import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { customAlphabet } from 'nanoid';
import bcrypt from 'bcryptjs';


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

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, role, password } = req.body || {};
    if (!name || !role || !password) return res.status(400).json({ error: 'name, role, password required' });
    if (!['user','manager'].includes(role)) return res.status(400).json({ error: 'role must be user|manager' });
    const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
    if (existing) return res.status(409).json({ error: 'username already taken' });

    const password_hash = await bcrypt.hash(password, 10);
    const info = db.prepare('INSERT INTO users (name, role, password_hash) VALUES (?, ?, ?)').run(name, role, password_hash);
    const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body || {};
    if (!name || !password) return res.status(400).json({ error: 'name and password required' });
    const row = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
    if (!row) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const user = { id: row.id, name: row.name, role: row.role };
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'unexpected error' });
  }
});

// Return the latest club the user belongs to (if any)
app.get('/users/:id/club', (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'invalid user id' });

  // if you have a 'joined_at' column, order by it; otherwise use rowid as recency
  const row = db.prepare(`
    SELECT c.*
    FROM club_members m
    JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ?
    ORDER BY m.rowid DESC
    LIMIT 1
  `).get(userId);

  if (!row) return res.status(404).json({ error: 'no club for user' });
  res.json(row);
});

// Configure sport for a club
// CREATE a sport config (allow any sport name + custom minutes)
app.post('/clubs/:clubId/sports', (req, res) => {
  const clubId = Number(req.params.clubId);
  const { sport, courts, openHour, closeHour, slotMinutes, managerId } = req.body || {};

  if (!managerId) return res.status(400).json({ error: 'managerId required' });
  if (!sport || String(sport).trim().length === 0) {
    return res.status(400).json({ error: 'sport is required' });
  }
  const minutes = Number(slotMinutes);
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) {
    return res.status(400).json({ error: 'slotMinutes must be between 5 and 240' });
  }

  // Optional: ensure the caller is the club manager
  const club = db.prepare('SELECT manager_id FROM clubs WHERE id = ?').get(clubId);
  if (!club) return res.status(404).json({ error: 'club not found' });
  if (club.manager_id !== Number(managerId)) return res.status(403).json({ error: 'forbidden' });

  try {
    const info = db.prepare(`
      INSERT INTO club_sports (club_id, sport, courts, open_hour, close_hour, slot_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clubId, String(sport).trim(), Number(courts), Number(openHour), Number(closeHour), minutes);

    const created = db.prepare('SELECT * FROM club_sports WHERE id = ?').get(info.lastInsertRowid);
    res.json(created);
  } catch (e) {
    // likely UNIQUE (club_id, sport) violation
    console.error(e);
    res.status(400).json({ error: 'could not create sport (maybe already exists for this club)' });
  }
});


// List sports configured for a club
app.get('/clubs/:clubId/sports', (req, res) => {
  const clubId = Number(req.params.clubId);
  const rows = db.prepare('SELECT * FROM club_sports WHERE club_id=?').all(clubId);
  res.json(rows);
});

// List all clubs a user belongs to
app.get('/users/:id/clubs', (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'invalid user id' });

  // ⚠️ Use the correct membership table name for YOUR schema.
  // If your schema used "club_members", keep the first query.
  // If it used just "members", use the second one (uncomment it).

  const rows = db.prepare(`
    SELECT c.*
    FROM club_members m
    JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ?
    ORDER BY c.name
  `).all(userId);

  // // If your table is named "members", use this instead:
  // const rows = db.prepare(`
  //   SELECT c.*
  //   FROM members m
  //   JOIN clubs c ON c.id = m.club_id
  //   WHERE m.user_id = ?
  //   ORDER BY c.name
  // `).all(userId);

  res.json(rows);
});

// UPDATE a sport config
app.put('/clubs/:clubId/sports/:id', (req, res) => {
  const clubId = Number(req.params.clubId);
  const id = Number(req.params.id);
  const { sport, courts, openHour, closeHour, slotMinutes, managerId } = req.body || {};
  if (!managerId) return res.status(400).json({ error: 'managerId required' });

  // Optional: ensure the caller is the club manager
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
  if (!club) return res.status(404).json({ error: 'club not found' });
  if (club.manager_id !== managerId) return res.status(403).json({ error: 'forbidden' });

  try {
    db.prepare(`
      UPDATE club_sports
      SET sport = ?, courts = ?, open_hour = ?, close_hour = ?, slot_minutes = ?
      WHERE id = ? AND club_id = ?
    `).run(sport, Number(courts), Number(openHour), Number(closeHour), Number(slotMinutes), id, clubId);

    const updated = db.prepare('SELECT * FROM club_sports WHERE id = ? AND club_id = ?').get(id, clubId);
    if (!updated) return res.status(404).json({ error: 'sport not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'update failed' });
  }
});

// DELETE a sport config
app.delete('/clubs/:clubId/sports/:id', (req, res) => {
  const clubId = Number(req.params.clubId);
  const id = Number(req.params.id);
  const { managerId } = req.body || {};
  if (!managerId) return res.status(400).json({ error: 'managerId required' });

  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
  if (!club) return res.status(404).json({ error: 'club not found' });
  if (club.manager_id !== managerId) return res.status(403).json({ error: 'forbidden' });

  const info = db.prepare('DELETE FROM club_sports WHERE id = ? AND club_id = ?').run(id, clubId);
  if (!info.changes) return res.status(404).json({ error: 'sport not found' });
  res.json({ ok: true });
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

// 1) Latest/active club for a user (if any)
app.get('/users/:id/club', (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'invalid user id' });

  const row = db.prepare(`
    SELECT c.*
    FROM club_members m
    JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ?
    ORDER BY m.rowid DESC
    LIMIT 1
  `).get(userId);

  if (!row) return res.status(404).json({ error: 'no club for user' });
  res.json(row);
});

// 2) All clubs a user belongs to
app.get('/users/:id/clubs', (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'invalid user id' });

  const rows = db.prepare(`
    SELECT c.*
    FROM club_members m
    JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ?
    ORDER BY c.name
  `).all(userId);

  res.json(rows);
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

