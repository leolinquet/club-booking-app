BEGIN;

-- Add timezone column to clubs (IANA timezone identifier, e.g. 'Europe/London')
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMIT;
