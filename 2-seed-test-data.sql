-- ✅ Insert users: 1 admin + 3 players
INSERT INTO users (username, password, role) VALUES
  ('admin', 'admin123', 'admin'),
  ('alice', 'alice123', 'player'),
  ('bob', 'bob123', 'player'),
  ('carol', 'carol123', 'player');

-- ✅ Insert players linked to those users (assuming sequential user IDs)
-- Note: IDs will be 1 (admin), 2 (alice), 3 (bob), 4 (carol)
INSERT INTO players (name, user_id) VALUES
  ('Alice A', 2),
  ('Bob B', 3),
  ('Carol C', 4);

-- ✅ Insert matches
-- Alice vs Bob: Alice wins
-- Bob vs Carol: Draw
-- Alice vs Carol: upcoming
INSERT INTO matches (player1_id, player2_id, date, score1, score2) VALUES
  (1, 2, '2025-07-01', 5, 3),  -- Alice vs Bob
  (2, 3, '2025-07-05', 6, 6),  -- Bob vs Carol
  (1, 3, '2025-07-20', NULL, NULL);  -- Alice vs Carol (upcoming)
