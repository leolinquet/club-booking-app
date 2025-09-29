BEGIN;

-- Create club_sports table to store per-club sport configuration used by the availability endpoint
CREATE TABLE IF NOT EXISTS club_sports (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sport TEXT NOT NULL DEFAULT 'tennis',
  courts INTEGER NOT NULL DEFAULT 1,
  slot_minutes INTEGER NOT NULL DEFAULT 60,
  open_hour INTEGER NOT NULL DEFAULT 9,
  close_hour INTEGER NOT NULL DEFAULT 21,
  UNIQUE (club_id, sport)
);

COMMIT;
