-- 018_add_email_verification_columns.sql
-- Add email verification token and expiration columns to users table

BEGIN;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verify_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMPTZ;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verify_token ON users(email_verify_token);

COMMIT;
