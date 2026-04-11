-- Initial schema for dotori.me
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker TEXT,
  account_type TEXT NOT NULL,
  owner TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS target_allocations (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  target_percent REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS instruments (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_snapshots (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  holdings TEXT NOT NULL,
  cash REAL NOT NULL,
  cash_flows TEXT,
  memo TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(account_id, date)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS securities (
  ticker TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  market TEXT NOT NULL,
  asset_class TEXT,
  category TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  date TEXT NOT NULL,
  close REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
