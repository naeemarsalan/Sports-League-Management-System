-- ✅ Insert users: 1 admin + 3 players
INSERT INTO users (username, password, role) VALUES
  ('admin', 'admin123', 'admin'),
  ('alice', 'alice123', 'player'),
  ('bob', 'bob123', 'player'),
  ('carol', 'carol123', 'player')
ON CONFLICT (username) DO NOTHING;

-- ✅ Insert players linked to those users (assuming sequential user IDs)
-- Note: IDs will be 1 (admin), 2 (alice), 3 (bob), 4 (carol)
-- Insert player profiles linked to correct user IDs
INSERT INTO players (name, user_id) VALUES
  ('Alice A', (SELECT id FROM users WHERE username = 'alice')),
  ('Bob B',   (SELECT id FROM users WHERE username = 'bob')),
  ('Carol C', (SELECT id FROM users WHERE username = 'carol'));

-- ✅ Insert matches
-- Alice vs Bob: Alice wins
-- Bob vs Carol: Draw
-- Alice vs Carol: upcoming
INSERT INTO matches (player1_id, player2_id, date, score1, score2) VALUES
  (
    (SELECT id FROM players WHERE name = 'Alice A'),
    (SELECT id FROM players WHERE name = 'Bob B'),
    '2025-07-01', 5, 3
  ),
  (
    (SELECT id FROM players WHERE name = 'Bob B'),
    (SELECT id FROM players WHERE name = 'Carol C'),
    '2025-07-05', 6, 6
  ),
  (
    (SELECT id FROM players WHERE name = 'Alice A'),
    (SELECT id FROM players WHERE name = 'Carol C'),
    '2025-07-20', NULL, NULL
  );
