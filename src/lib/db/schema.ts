import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── 사용자 ─────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoid
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── 포트폴리오 ─────────────────────────────────────────
export const portfolios = sqliteTable("portfolios", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── 계좌 ───────────────────────────────────────────────
export type AccountType = "irp" | "pension" | "isa" | "brokerage" | "cma";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // 별칭 (예: "삼성 IRP", "키움 위탁")
  broker: text("broker"), // 증권사
  accountType: text("account_type").notNull(), // AccountType
  owner: text("owner"), // 본인 / 배우자 등
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── 목표 비중 (종목별) ─────────────────────────────────
export const targetAllocations = sqliteTable("target_allocations", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(), // 종목 코드 (예: "069500") 또는 "__CASH__" (현금)
  name: text("name").notNull(), // 종목명 (예: "KODEX 200") 또는 "현금"
  targetPercent: real("target_percent").notNull(), // 0~100
});

// ─── 보유 종목 스냅샷 (일자별 기록) ─────────────────────
export const holdings = sqliteTable("holdings", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(), // 종목 코드
  name: text("name").notNull(), // 종목명
  assetClass: text("asset_class").notNull(), // 자산군 분류
  shares: real("shares").notNull(), // 보유 수량
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── 예수금 기록 ────────────────────────────────────────
export const cashBalances = sqliteTable("cash_balances", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  balance: real("balance").notNull(), // 예수금 잔액
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── 입출금 기록 ────────────────────────────────────────
export const cashFlows = sqliteTable("cash_flows", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  amount: real("amount").notNull(), // 양수=입금, 음수=출금
  memo: text("memo"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── 세션 ──────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(), // unix ms
});

// ─── 종가 데이터 (시세 캐시) ────────────────────────────
export const prices = sqliteTable("prices", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  close: real("close").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
