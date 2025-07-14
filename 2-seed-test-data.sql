-- ✅ Insert users: 1 admin + 3 players
INSERT INTO users (username, password, role) VALUES
  ('adam', 'adam123', 'player'),
  ('nathan', 'nathan123', 'player'),
  ('reece', 'reece123', 'player'),
  ('danny', 'danny123', 'player'),
  ('simon', 'simon123', 'player'),
  ('gaz', 'gaz123', 'player'),
  ('mike', 'mike123', 'player'),
  ('rob', 'rob123', 'player');

-- ✅ Seed players, resolving user_id from usernames
INSERT INTO players (name, user_id) VALUES
  ('Adam Byron', (SELECT id FROM users WHERE username = 'adam')),
  ('Nathan Fraser', (SELECT id FROM users WHERE username = 'nathan')),
  ('Reece Fraser', (SELECT id FROM users WHERE username = 'reece')),
  ('Danny Tatton', (SELECT id FROM users WHERE username = 'danny')),
  ('Simon Knowles', (SELECT id FROM users WHERE username = 'simon')),
  ('Gareth Caldwell', (SELECT id FROM users WHERE username = 'gaz')),
  ('Mike Henderson', (SELECT id FROM users WHERE username = 'mike')),
  ('Rob Oliver', (SELECT id FROM users WHERE username = 'rob'));

