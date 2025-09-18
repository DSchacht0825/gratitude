-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Journal entries table
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  morning_gratitude1 TEXT,
  morning_gratitude2 TEXT,
  morning_gratitude3 TEXT,
  morning_intention TEXT,
  morning_prayer TEXT,
  evening_reflection1 TEXT,
  evening_reflection2 TEXT,
  evening_reflection3 TEXT,
  evening_learning TEXT,
  evening_gratitude TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, date)
);