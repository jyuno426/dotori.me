/**
 * 테스트용 in-memory SQLite DB 헬퍼
 *
 * 각 테스트 파일에서 독립된 DB를 생성하여 테스트 격리를 보장한다.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // 스키마에서 테이블 생성
  sqlite.exec(`
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
  `);

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

/**
 * 테스트용 사용자 생성 (비밀번호: test1234)
 */
export function seedTestUser(db: ReturnType<typeof createTestDb>["db"]) {
  const crypto = require("crypto");
  const salt = "a".repeat(32);
  const hash = crypto
    .pbkdf2Sync("test1234", salt, 100000, 64, "sha512")
    .toString("hex");

  db.insert(schema.users)
    .values({
      id: "test-user-1",
      email: "test@dotori.me",
      name: "테스트유저",
      passwordHash: `${salt}:${hash}`,
    })
    .run();

  return { id: "test-user-1", email: "test@dotori.me", name: "테스트유저" };
}

/**
 * 테스트용 포트폴리오 생성
 */
export function seedTestPortfolio(
  db: ReturnType<typeof createTestDb>["db"],
  userId: string = "test-user-1",
) {
  db.insert(schema.portfolios)
    .values({
      id: "test-portfolio-1",
      userId,
      name: "테스트 포트폴리오",
      description: "테스트용",
    })
    .run();

  return { id: "test-portfolio-1", userId, name: "테스트 포트폴리오" };
}

/**
 * 테스트용 계좌 생성
 */
export function seedTestAccount(
  db: ReturnType<typeof createTestDb>["db"],
  portfolioId: string = "test-portfolio-1",
) {
  db.insert(schema.accounts)
    .values({
      id: "test-account-1",
      portfolioId,
      name: "테스트 IRP",
      broker: "삼성증권",
      accountType: "irp",
      owner: "본인",
    })
    .run();

  return { id: "test-account-1", portfolioId, name: "테스트 IRP" };
}

/**
 * 테스트용 스냅샷 생성
 */
export function seedTestSnapshot(
  db: ReturnType<typeof createTestDb>["db"],
  accountId: string = "test-account-1",
  overrides: {
    id?: string;
    date?: string;
    holdings?: Array<{ ticker: string; name: string; assetClass: string; amount: number }>;
    cash?: number;
    cashFlows?: Array<{ flowType: string; amount: number; memo?: string }>;
    memo?: string;
  } = {},
) {
  const id = overrides.id ?? "test-snapshot-1";
  const date = overrides.date ?? "2026-04-07";
  const holdings = overrides.holdings ?? [
    { ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 100 },
  ];
  const cash = overrides.cash ?? 10000;
  const cashFlows = overrides.cashFlows ?? null;

  db.insert(schema.accountSnapshots)
    .values({
      id,
      accountId,
      date,
      holdings: JSON.stringify(holdings),
      cash,
      cashFlows: cashFlows ? JSON.stringify(cashFlows) : null,
      memo: overrides.memo ?? null,
    })
    .run();

  return { id, accountId, date, holdings, cash, cashFlows };
}

/**
 * 테스트용 세션 생성
 */
export function seedTestSession(
  db: ReturnType<typeof createTestDb>["db"],
  userId: string = "test-user-1",
) {
  const token = "test-session-token-abc123";
  db.insert(schema.sessions)
    .values({
      token,
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
    .run();

  return token;
}
