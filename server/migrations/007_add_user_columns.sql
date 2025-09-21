BEGIN;

-- Add username, role, and is_manager to users for auth compatibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false;

-- Create a case-insensitive unique index on username if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'users_username_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX users_username_lower_idx ON users (LOWER(username));
  END IF;
END$$;

COMMIT;
