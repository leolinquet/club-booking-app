-- map players to tournaments, includes seed
CREATE TABLE IF NOT EXISTS tournament_players (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed          INT,
  UNIQUE (tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_player     ON tournament_players(player_id);
