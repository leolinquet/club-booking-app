BEGIN;

-- Create message_reads table to track which messages each user has read
CREATE TABLE IF NOT EXISTS message_reads (
  id BIGSERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);

COMMIT;