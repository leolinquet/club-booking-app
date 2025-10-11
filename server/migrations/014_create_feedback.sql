-- Migration: Create feedback table and related indexes
-- File: 014_create_feedback.sql

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

-- Add constraint for email validation (basic check)
ALTER TABLE feedback ADD CONSTRAINT feedback_email_valid 
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Grant appropriate permissions
GRANT SELECT, INSERT ON feedback TO PUBLIC;
GRANT UPDATE ON feedback TO PUBLIC; -- For status updates by managers
GRANT USAGE, SELECT ON SEQUENCE feedback_id_seq TO PUBLIC;