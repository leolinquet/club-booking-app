INSERT INTO clubs (name, city, state) VALUES ('Local Test Club', 'Lincoln', 'NE') ON CONFLICT DO NOTHING;

WITH c AS (
  SELECT id FROM clubs WHERE name='Local Test Club' LIMIT 1
)
INSERT INTO courts (club_id, label)
SELECT c.id, 'Court ' || g::text
FROM c, generate_series(1,31) AS g
ON CONFLICT DO NOTHING;
