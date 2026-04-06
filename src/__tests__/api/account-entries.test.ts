import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTestDb,
  seedTestUser,
  seedTestPortfolio,
  seedTestAccount,
  seedTestSession,
} from "../helpers/test-db";
import { cookieStore } from "../setup";
import { createRequest, parseResponse } from "../helpers/request";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
}));

const { GET, POST, DELETE } = await import(
  "@/app/api/account-entries/route"
);

describe("/api/account-entries", () => {
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

  describe("POST", () => {
    it("보유 종목 기록을 추가한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "holding",
        ticker: "069500",
        name: "KODEX 200",
        assetClass: "domestic_equity",
        amount: 100,
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.ticker).toBe("069500");
      expect(body.amount).toBe(100);
    });

    it("같은 (accountId, date, ticker) 조합이면 upsert한다", async () => {
      authenticate();
      const create = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "holding",
        ticker: "069500",
        name: "KODEX 200",
        assetClass: "domestic_equity",
        amount: 100,
      });
      await POST(create);

      const update = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "holding",
        ticker: "069500",
        name: "KODEX 200",
        assetClass: "domestic_equity",
        amount: 150,
      });
      const { body, status } = await parseResponse(await POST(update));
      expect(status).toBe(200);
      expect(body.amount).toBe(150);
    });

    it("예수금 기록을 추가한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "cash",
        ticker: "__CASH__",
        name: "예수금",
        amount: 500000,
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.type).toBe("cash");
    });

    it("입출금 기록을 추가한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "cash_flow",
        ticker: "__CASHFLOW__",
        name: "입출금",
        amount: 1000000,
        memo: "월 적립",
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.memo).toBe("월 적립");
    });

    it("필수 필드 누락 시 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("소유권 확인 실패 시 404를 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "nonexistent",
        date: "2025-01-15",
        type: "cash",
        ticker: "__CASH__",
        name: "예수금",
        amount: 100,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(404);
    });
  });

  describe("GET", () => {
    it("accountId와 portfolioId 모두 없으면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("GET", "/api/account-entries");
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(400);
    });

    it("accountId로 holding 기록을 조회한다", async () => {
      authenticate();
      // 데이터 삽입
      const create = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "holding",
        ticker: "069500",
        name: "KODEX 200",
        assetClass: "domestic_equity",
        amount: 100,
      });
      await POST(create);

      const req = createRequest(
        "GET",
        "/api/account-entries?accountId=test-account-1&type=holding",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
    });

    it("cash 타입은 최신 1건만 반환한다", async () => {
      authenticate();
      // 두 개의 cash 기록 삽입
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-01-15",
          type: "cash",
          ticker: "__CASH__",
          name: "예수금",
          amount: 500000,
        }),
      );
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-02-15",
          type: "cash",
          ticker: "__CASH__",
          name: "예수금",
          amount: 600000,
        }),
      );

      const req = createRequest(
        "GET",
        "/api/account-entries?accountId=test-account-1&type=cash",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      // cash는 최신 1건 (날짜 내림차순이므로 2월)
      expect(body).not.toBeNull();
      expect(body.amount).toBe(600000);
    });

    it("cash_flow 타입은 summary를 포함한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-01-01",
          type: "cash_flow",
          ticker: "__CASHFLOW__",
          name: "입출금",
          amount: 1000000,
        }),
      );
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-02-01",
          type: "cash_flow",
          ticker: "__CASHFLOW__",
          name: "입출금",
          amount: -200000,
        }),
      );

      const req = createRequest(
        "GET",
        "/api/account-entries?accountId=test-account-1&type=cash_flow",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body.summary.totalDeposit).toBe(1000000);
      expect(body.summary.totalWithdrawal).toBe(-200000);
      expect(body.summary.net).toBe(800000);
    });

    it("portfolioId로 cash 타입을 조회하면 계좌별 잔액을 반환한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-01-15",
          type: "cash",
          ticker: "__CASH__",
          name: "예수금",
          amount: 500000,
        }),
      );

      const req = createRequest(
        "GET",
        "/api/account-entries?portfolioId=test-portfolio-1&type=cash",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body.balances).toHaveLength(1);
      expect(body.total).toBe(500000);
    });
  });

  describe("DELETE", () => {
    it("기록을 삭제한다", async () => {
      authenticate();
      const createReq = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        type: "holding",
        ticker: "069500",
        name: "KODEX 200",
        assetClass: "domestic_equity",
        amount: 100,
      });
      const { body: created } = await parseResponse(await POST(createReq));

      const req = createRequest(
        "DELETE",
        `/api/account-entries?id=${created.id}`,
      );
      const { body, status } = await parseResponse(await DELETE(req));
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
    });

    it("id 없이 삭제하면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("DELETE", "/api/account-entries");
      const { status } = await parseResponse(await DELETE(req));
      expect(status).toBe(400);
    });

    it("존재하지 않는 기록 삭제 시 404를 반환한다", async () => {
      authenticate();
      const req = createRequest(
        "DELETE",
        "/api/account-entries?id=nonexistent",
      );
      const { status } = await parseResponse(await DELETE(req));
      expect(status).toBe(404);
    });
  });
});
