BEGIN;

-- Add timezone column to clubs if missing (IANA timezone string, e.g. 'Europe/London')
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMIT;
