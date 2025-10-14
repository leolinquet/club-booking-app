-- Migration: Add active_club_id to users table
-- This allows each user to have their own stored active club

ALTER TABLE users ADD COLUMN IF NOT EXISTS active_club_id INTEGER;
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_active_club 
  FOREIGN KEY (active_club_id) REFERENCES clubs(id) ON DELETE SET NULL;