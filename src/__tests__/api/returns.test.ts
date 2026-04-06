import { describe, it, expect, beforeEach, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import {
  createTestDb,
  seedTestUser,
  seedTestPortfolio,
  seedTestAccount,
  seedTestSession,
  seedTestSnapshot,
} from "../helpers/test-db";
import { cookieStore } from "../setup";
import { createRequest, parseResponse } from "../helpers/request";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
}));

const { GET } = await import("@/app/api/returns/route");

describe("/api/returns", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  function authenticate() {
    seedTestUser(testDb.db);
    const token = seedTestSession(testDb.db);
    cookieStore.set("dotori_session", token);
    seedTestPortfolio(testDb.db);
    seedTestAccount(testDb.db);
  }

  function insertPrice(ticker: string, date: string, close: number) {
    testDb.db
      .insert(schema.prices)
      .values({
        id: `price-${Math.random().toString(36).slice(2, 8)}`,
        ticker,
        date,
        close,
      })
      .run();
  }

  it("portfolioId 없이 요청하면 400을 반환한다", async () => {
    authenticate();
    const req = createRequest("GET", "/api/returns");
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(400);
  });

  it("존재하지 않는 포트폴리오는 404를 반환한다", async () => {
    authenticate();
    const req = createRequest("GET", "/api/returns?portfolioId=nonexistent");
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(404);
  });

  it("빈 포트폴리오의 수익률을 계산한다", async () => {
    authenticate();
    const req = createRequest(
      "GET",
      "/api/returns?portfolioId=test-portfolio-1",
    );
    const { body, status } = await parseResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.totalValue).toBe(0);
    expect(body.netInvested).toBe(0);
    expect(body.returnRate).toBe(0);
  });

  it("입출금 + 보유 + 예수금으로 수익률을 계산한다", async () => {
    authenticate();

    // 1월: 입금 1,000,000원
    seedTestSnapshot(testDb.db, "test-account-1", {
      id: "snap-1",
      date: "2025-01-01",
      holdings: [],
      cash: 0,
      cashFlows: [{ flowType: "deposit", amount: 1000000 }],
    });

    // 2월: 출금 100,000원
    seedTestSnapshot(testDb.db, "test-account-1", {
      id: "snap-2",
      date: "2025-02-01",
      holdings: [],
      cash: 0,
      cashFlows: [{ flowType: "withdrawal", amount: 100000 }],
    });

    // 3월: 보유 종목 100주, 예수금 200,000원
    seedTestSnapshot(testDb.db, "test-account-1", {
      id: "snap-3",
      date: "2025-03-01",
      holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 100 }],
      cash: 200000,
    });

    // 현재가 8,000원
    insertPrice("069500", "2025-03-01", 8000);

    const req = createRequest(
      "GET",
      "/api/returns?portfolioId=test-portfolio-1",
    );
    const { body, status } = await parseResponse(await GET(req));
    expect(status).toBe(200);

    // netInvested = 1,000,000 + (-100,000) = 900,000
    expect(body.totalDeposit).toBe(1000000);
    expect(body.totalWithdrawal).toBe(-100000);
    expect(body.netInvested).toBe(900000);

    // holdingsValue = 100 * 8,000 = 800,000
    expect(body.holdingsValue).toBe(800000);

    // totalCash = 200,000 (최신 스냅샷)
    expect(body.totalCash).toBe(200000);

    // totalValue = 800,000 + 200,000 = 1,000,000
    expect(body.totalValue).toBe(1000000);

    // profitLoss = 1,000,000 - 900,000 = 100,000
    expect(body.profitLoss).toBe(100000);

    // returnRate = (100,000 / 900,000) * 100 ≈ 11.11
    expect(body.returnRate).toBe(11.11);
  });

  it("가격 데이터가 없는 종목을 missingPrices에 포함한다", async () => {
    authenticate();

    seedTestSnapshot(testDb.db, "test-account-1", {
      id: "snap-1",
      date: "2025-03-01",
      holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 100 }],
      cash: 0,
    });

    const req = createRequest(
      "GET",
      "/api/returns?portfolioId=test-portfolio-1",
    );
    const { body } = await parseResponse(await GET(req));
    expect(body.missingPrices).toContain("069500");
    expect(body.holdingsValue).toBe(0);
  });

  it("holdingDetails에 종목별 상세를 포함한다", async () => {
    authenticate();

    seedTestSnapshot(testDb.db, "test-account-1", {
      id: "snap-1",
      date: "2025-03-01",
      holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 50 }],
      cash: 0,
    });

    insertPrice("069500", "2025-03-01", 10000);

    const req = createRequest(
      "GET",
      "/api/returns?portfolioId=test-portfolio-1",
    );
    const { body } = await parseResponse(await GET(req));
    expect(body.holdingDetails).toHaveLength(1);
    expect(body.holdingDetails[0]).toMatchObject({
      ticker: "069500",
      shares: 50,
      price: 10000,
      value: 500000,
    });
  });
});
