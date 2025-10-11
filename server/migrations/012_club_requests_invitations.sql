-- Add auto-approve column to clubs
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS auto_approve_join BOOLEAN NOT NULL DEFAULT false;

-- Create join requests table (user used a club code to ask access)
CREATE TABLE IF NOT EXISTS club_join_requests (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'accepted'|'declined'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cjr_club_status ON club_join_requests (club_id, status);

-- Create invitations table (manager invites a user by username)
CREATE TABLE IF NOT EXISTS club_invitations (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  invited_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'accepted'|'declined'|'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ci_club_status ON club_invitations (club_id, status);