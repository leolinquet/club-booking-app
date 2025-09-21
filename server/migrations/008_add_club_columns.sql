BEGIN;

-- Ensure clubs has columns used by the server
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'tennis';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS manager_id BIGINT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS code TEXT;

-- Make code unique if possible (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'clubs_code_key') THEN
    BEGIN
      -- add unique constraint/index if column exists
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='code') THEN
        CREATE UNIQUE INDEX clubs_code_key ON clubs (code);
      END IF;
    END;
  END IF;
END$$;

-- Create user_clubs join table if it's missing
CREATE TABLE IF NOT EXISTS user_clubs (
  user_id BIGINT NOT NULL,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player',
  UNIQUE (user_id, club_id)
);

COMMIT;
