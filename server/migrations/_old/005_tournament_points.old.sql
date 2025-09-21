-- 005_tournament_points.sql
CREATE TABLE IF NOT EXISTS tournament_points (
  id SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  placement INT,
  UNIQUE (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_tournament_user
  ON tournament_points (tournament_id, user_id);
