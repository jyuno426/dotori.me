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

describe("/api/account-entries (스냅샷)", () => {
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
    it("스냅샷을 생성한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        holdings: [
          { ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 100 },
        ],
        cash: 50000,
        cashFlows: [{ flowType: "deposit", amount: 1000000, memo: "월 적립" }],
        memo: "1월 기록",
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.date).toBe("2025-01-15");
      expect(body.cash).toBe(50000);
      expect(body.memo).toBe("1월 기록");

      const holdings = JSON.parse(body.holdings);
      expect(holdings).toHaveLength(1);
      expect(holdings[0].ticker).toBe("069500");
      expect(holdings[0].amount).toBe(100);

      const cashFlows = JSON.parse(body.cashFlows);
      expect(cashFlows).toHaveLength(1);
      expect(cashFlows[0].flowType).toBe("deposit");
      expect(cashFlows[0].amount).toBe(1000000);
    });

    it("같은 (accountId, date) 조합이면 upsert한다", async () => {
      authenticate();
      const create = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 100 }],
        cash: 50000,
      });
      await POST(create);

      const update = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 200 }],
        cash: 70000,
      });
      const { body, status } = await parseResponse(await POST(update));
      expect(status).toBe(200);
      expect(body.cash).toBe(70000);
      const holdings = JSON.parse(body.holdings);
      expect(holdings[0].amount).toBe(200);
    });

    it("입출금을 여러 건 기록할 수 있다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        holdings: [],
        cash: 0,
        cashFlows: [
          { flowType: "deposit", amount: 1000000, memo: "월 적립" },
          { flowType: "withdrawal", amount: 200000, memo: "생활비" },
          { flowType: "deposit", amount: 500000 },
        ],
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      const cashFlows = JSON.parse(body.cashFlows);
      expect(cashFlows).toHaveLength(3);
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
        holdings: [],
        cash: 0,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(404);
    });

    it("인증 없이 요청하면 401을 반환한다", async () => {
      const req = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        holdings: [],
        cash: 0,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(401);
    });
  });

  describe("GET", () => {
    it("accountId와 portfolioId 모두 없으면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("GET", "/api/account-entries");
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(400);
    });

    it("accountId로 스냅샷 목록을 조회한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-01-15",
          holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 100 }],
          cash: 50000,
        }),
      );
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-02-15",
          holdings: [{ ticker: "069500", name: "KODEX 200", assetClass: "domestic_equity", amount: 120 }],
          cash: 60000,
        }),
      );

      const req = createRequest("GET", "/api/account-entries?accountId=test-account-1");
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      // 최신 날짜가 먼저
      expect(body[0].date).toBe("2025-02-15");
    });

    it("portfolioId로 전체 스냅샷을 조회한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/account-entries", {
          accountId: "test-account-1",
          date: "2025-01-15",
          holdings: [],
          cash: 50000,
        }),
      );

      const req = createRequest("GET", "/api/account-entries?portfolioId=test-portfolio-1");
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
      expect(body[0].accountName).toBe("테스트 IRP");
    });
  });

  describe("DELETE", () => {
    it("스냅샷을 삭제한다", async () => {
      authenticate();
      const createReq = createRequest("POST", "/api/account-entries", {
        accountId: "test-account-1",
        date: "2025-01-15",
        holdings: [],
        cash: 0,
      });
      const { body: created } = await parseResponse(await POST(createReq));

      const req = createRequest("DELETE", `/api/account-entries?id=${created.id}`);
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

    it("존재하지 않는 스냅샷 삭제 시 404를 반환한다", async () => {
      authenticate();
      const req = createRequest("DELETE", "/api/account-entries?id=nonexistent");
      const { status } = await parseResponse(await DELETE(req));
      expect(status).toBe(404);
    });
  });
});
