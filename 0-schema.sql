-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player'
);

-- PLAYERS TABLE
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- MATCHES TABLE
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  score_player1 INTEGER,
  score_player2 INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (player1_id) REFERENCES players(id),
  FOREIGN KEY (player2_id) REFERENCES players(id)
);
