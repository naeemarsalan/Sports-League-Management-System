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
-- ✅ Seed users (excluding admin, already created in 1-init-admin.sh)
INSERT INTO users (username, password, role) VALUES
  ('alice', 'alice123', 'player'),
  ('bob', 'bob123', 'player'),
  ('carol', 'carol123', 'player')
ON CONFLICT (username) DO NOTHING;

-- ✅ Seed players, resolving user_id from usernames
INSERT INTO players (name, user_id) VALUES
  ('Alice A', (SELECT id FROM users WHERE username = 'alice')),
  ('Bob B', (SELECT id FROM users WHERE username = 'bob')),
  ('Carol C', (SELECT id FROM users WHERE username = 'carol'));

