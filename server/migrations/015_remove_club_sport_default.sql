BEGIN;

-- Remove the default 'tennis' value from the sport column in clubs table
-- This allows clubs to be created without automatically getting 'tennis' as the sport
ALTER TABLE clubs ALTER COLUMN sport DROP DEFAULT;
ALTER TABLE clubs ALTER COLUMN sport DROP NOT NULL;

COMMIT;