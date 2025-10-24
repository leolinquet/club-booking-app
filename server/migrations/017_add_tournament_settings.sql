-- Migration: Add tournament settings columns
-- Created: 2025-01-17
-- Description: Adds draw_size, seed_count, and points_by_round columns to tournaments table

BEGIN;

-- Add draw_size column (default 16)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS draw_size INTEGER DEFAULT 16;

-- Add seed_count column (default 4)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS seed_count INTEGER DEFAULT 4;

-- Add points_by_round column (JSON stored as TEXT)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS points_by_round TEXT DEFAULT '{}';

-- Add format column if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'single_elim' CHECK(format IN ('single_elim','round_robin'));

-- Add start_date column if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add block_courts column if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS block_courts INTEGER DEFAULT 0;

-- Add seeds_count column if it doesn't exist (legacy column)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS seeds_count INTEGER DEFAULT 0;

COMMIT;
