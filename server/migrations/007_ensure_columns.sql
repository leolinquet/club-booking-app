-- Idempotent migration to ensure commonly used columns exist
BEGIN;

-- tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS seeds_count INTEGER DEFAULT 0;

-- matches: scores, winner and status used by bracket code
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_score INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_score INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id BIGINT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT;

-- club_sports: ensure an id column exists for ordering in older installs
ALTER TABLE club_sports ADD COLUMN IF NOT EXISTS id BIGSERIAL;

-- bookings: normalize column names that older schemas used differently
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS court_index INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time TEXT;

COMMIT;

-- This migration is deliberately idempotent and safe to run multiple times.
