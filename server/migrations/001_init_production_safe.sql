-- 001_init.sql — clean, ordered schema for Postgres (Production Safe)

BEGIN;

-- Create tables with IF NOT EXISTS for production safety

-- users first (no FKs)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  email_verify_token TEXT,
  email_verify_expires TIMESTAMPTZ
);

-- clubs next
CREATE TABLE IF NOT EXISTS clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT
);

-- courts references clubs
CREATE TABLE IF NOT EXISTS courts (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  label TEXT NOT NULL
);

-- bookings references clubs, courts, users
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  club_id  INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  court_id INT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL,
  UNIQUE (court_id, starts_at)   -- prevents double-booking a court at that hour
);

-- helpful index for app-level "one upcoming booking per user" check
CREATE INDEX IF NOT EXISTS idx_bookings_user_starts ON bookings(user_id, starts_at);

-- tournaments (if you use them)
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  end_date DATE
);

-- matches (if you use them)
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INT NOT NULL,
  slot INT NOT NULL,
  p1_id INT REFERENCES users(id),
  p2_id INT REFERENCES users(id),
  winner_id INT REFERENCES users(id),
  score TEXT
);

COMMIT;