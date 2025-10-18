-- 006_players_and_points_reset.sql (Production Safe)
BEGIN;

-- 1) Core players table (user_id nullable to allow guests)
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INT,                         -- nullable (guest players)
  display_name TEXT NOT NULL,
  UNIQUE (club_id, user_id)
);

-- 2) Create tournament_players to reference players (not users) - only if not exists
CREATE TABLE IF NOT EXISTS tournament_players (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed INT,
  UNIQUE (tournament_id, player_id)
);

-- Create indexes only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tp_tournament') THEN
        CREATE INDEX idx_tp_tournament ON tournament_players(tournament_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tp_player') THEN
        CREATE INDEX idx_tp_player ON tournament_players(player_id);
    END IF;
END$$;

-- 3) Create tournament_points with player_id - only if not exists
CREATE TABLE IF NOT EXISTS tournament_points (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  placement INT,
  UNIQUE (tournament_id, player_id)
);

-- Create index only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tpoints_tournament_player') THEN
        CREATE INDEX idx_tpoints_tournament_player ON tournament_points (tournament_id, player_id);
    END IF;
END$$;

-- 4) Create standings to reference players - only if not exists
CREATE TABLE IF NOT EXISTS standings (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournaments_played INT NOT NULL DEFAULT 0,
  matches_won INT NOT NULL DEFAULT 0,
  matches_lost INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, player_id)
);

-- Create index only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_standings_club_points') THEN
        CREATE INDEX idx_standings_club_points ON standings (club_id, points DESC, player_id);
    END IF;
END$$;

-- 5) Update matches table to reference players if needed
-- First, check if matches table exists and needs updating
DO $$
BEGIN
    -- Check if matches table exists and if it has the old structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches') THEN
        -- Check if it already has the player_id columns (new structure)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'matches' AND column_name = 'p1_id' 
                      AND data_type = 'integer') THEN
            -- Table exists but has old structure, we need to update it
            -- This is a complex migration that should be handled separately
            RAISE NOTICE 'Matches table exists with old structure - manual migration may be needed';
        END IF;
    ELSE
        -- Table doesn't exist, create it with new structure
        CREATE TABLE matches (
          id SERIAL PRIMARY KEY,
          tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
          round INT NOT NULL,
          slot INT NOT NULL,
          p1_id INT REFERENCES players(id),
          p2_id INT REFERENCES players(id),
          winner_id INT REFERENCES players(id),
          score TEXT
        );
    END IF;
END$$;

COMMIT;