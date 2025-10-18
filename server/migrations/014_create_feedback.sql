-- Migration: Create feedback table and related indexes
-- File: 014_create_feedback.sql

BEGIN;

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  club_id BIGINT REFERENCES clubs(id) ON DELETE SET NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  category TEXT CHECK (category IN ('bug','ux','feature','other')) NOT NULL,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 2000),
  allow_contact BOOLEAN NOT NULL DEFAULT true,
  email TEXT,
  attachment_url TEXT,
  app_version TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','dismissed'))
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS feedback_created_idx ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback(status);
CREATE INDEX IF NOT EXISTS feedback_club_idx ON feedback(club_id);
CREATE INDEX IF NOT EXISTS feedback_user_idx ON feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_category_idx ON feedback(category);

-- Add constraint for email validation (basic check) - only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'feedback_email_valid'
  ) THEN
    ALTER TABLE feedback ADD CONSTRAINT feedback_email_valid 
      CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

COMMIT;