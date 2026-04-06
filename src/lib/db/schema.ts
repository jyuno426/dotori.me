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

// ─── 포트폴리오 종목 (instruments) ──────────────────────
export const instruments = sqliteTable("instruments", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  assetClass: text("asset_class").notNull(),
});

// ─── 계좌 스냅샷 (날짜별 1행) ──────────────────────────
// UNIQUE(accountId, date)
// holdings, cashFlows는 JSON 문자열
export const accountSnapshots = sqliteTable("account_snapshots", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  holdings: text("holdings").notNull(), // JSON: [{ ticker, name, assetClass, amount }]
  cash: real("cash").notNull(), // 예수금
  cashFlows: text("cash_flows"), // JSON: [{ flowType, amount, memo }] | null
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

// ─── 상장 종목 마스터 (KRX) ─────────────────────────────
export const securities = sqliteTable("securities", {
  ticker: text("ticker").primaryKey(), // KRX 종목코드
  name: text("name").notNull(),
  market: text("market").notNull(), // "ETF" | "STOCK" | "ETN"
  assetClass: text("asset_class"), // domestic_equity | foreign_equity | bond | alternative
  category: text("category"), // KRX 원본 카테고리
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
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
