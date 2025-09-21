-- 001_init.sql — clean, ordered schema for Postgres

BEGIN;

-- Start from a clean slate (safe on a new DB; harmless otherwise)
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- users first (no FKs)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ
);

-- clubs next
CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT
);

-- courts references clubs
CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  label TEXT NOT NULL
);

-- bookings references clubs, courts, users
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  club_id  INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  court_id INT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL,
  UNIQUE (court_id, starts_at)   -- prevents double-booking a court at that hour
);

-- helpful index for app-level “one upcoming booking per user” check
CREATE INDEX idx_bookings_user_starts ON bookings(user_id, starts_at);

-- tournaments (if you use them)
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  end_date DATE
);

-- matches (if you use them)
CREATE TABLE matches (
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
