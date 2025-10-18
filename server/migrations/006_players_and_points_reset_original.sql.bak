-- 006_players_and_points_reset.sql
BEGIN;

-- 1) Core players table (user_id nullable to allow guests)
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INT,                         -- nullable (guest players)
  display_name TEXT NOT NULL,
  UNIQUE (club_id, user_id)
);

-- 2) Recreate tournament_players to reference players (not users)
DROP TABLE IF EXISTS tournament_players CASCADE;
CREATE TABLE tournament_players (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed INT,
  UNIQUE (tournament_id, player_id)
);
CREATE INDEX idx_tp_tournament ON tournament_players(tournament_id);
CREATE INDEX idx_tp_player     ON tournament_players(player_id);

-- 3) Recreate tournament_points with player_id
DROP TABLE IF EXISTS tournament_points CASCADE;
CREATE TABLE tournament_points (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  placement INT,
  UNIQUE (tournament_id, player_id)
);
CREATE INDEX idx_tpoints_tournament_player
  ON tournament_points (tournament_id, player_id);

-- 4) Recreate standings to reference players
DROP TABLE IF EXISTS standings CASCADE;
CREATE TABLE standings (
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
CREATE INDEX idx_standings_club_points
  ON standings (club_id, points DESC, player_id);

-- 5) (Optional but recommended) make matches reference players too
DROP TABLE IF EXISTS matches CASCADE;
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

COMMIT;
