BEGIN;

-- Create conversations table for 1-on-1 chats within clubs
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user_a < user_b to avoid duplicate conversations
    CONSTRAINT conversations_user_order CHECK (user_a < user_b),
    
    -- Unique constraint to prevent duplicate conversations
    UNIQUE (club_id, user_a, user_b)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure body is not empty
    CONSTRAINT messages_body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_club_users ON conversations(club_id, user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Function to update conversation updated_at when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON messages;
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

COMMIT;