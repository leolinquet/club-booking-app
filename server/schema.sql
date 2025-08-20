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
