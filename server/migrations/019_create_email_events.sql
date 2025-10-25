-- 019_create_email_events.sql
-- Track email events from Resend webhooks

BEGIN;

CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  email_id VARCHAR(100),
  recipient VARCHAR(255),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC);

COMMIT;
