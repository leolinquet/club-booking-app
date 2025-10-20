-- 007_email_verification.sql
-- Add email verification columns to users table

BEGIN;

-- Add email verification columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verify_token TEXT,
ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verify_token ON users(email_verify_token);

-- Create index for checking verification status
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified_at);

COMMIT;