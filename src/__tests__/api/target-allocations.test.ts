import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTestDb,
  seedTestUser,
  seedTestPortfolio,
  seedTestSession,
} from "../helpers/test-db";
import { cookieStore } from "../setup";
import { createRequest, parseResponse } from "../helpers/request";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  getDb: () => testDb.db,
}));

const { GET, POST } = await import("@/app/api/target-allocations/route");

describe("/api/target-allocations", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  function authenticate() {
    seedTestUser(testDb.db);
    const token = seedTestSession(testDb.db);
    cookieStore.set("dotori_session", token);
    seedTestPortfolio(testDb.db);
  }

  describe("GET", () => {
    it("목표 비중을 조회한다", async () => {
      authenticate();
      // 먼저 저장
      await POST(
        createRequest("POST", "/api/target-allocations", {
          portfolioId: "test-portfolio-1",
          allocations: [
            { ticker: "069500", name: "KODEX 200", targetPercent: 60 },
            { ticker: "__CASH__", name: "현금", targetPercent: 40 },
          ],
        }),
      );

      const req = createRequest(
        "GET",
        "/api/target-allocations?portfolioId=test-portfolio-1",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body).toHaveLength(2);
    });

    it("portfolioId 없이 요청하면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("GET", "/api/target-allocations");
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(400);
    });
  });

  describe("POST", () => {
    it("목표 비중을 저장한다 (합계 100%)", async () => {
      authenticate();
      const req = createRequest("POST", "/api/target-allocations", {
        portfolioId: "test-portfolio-1",
        allocations: [
          { ticker: "069500", name: "KODEX 200", targetPercent: 50 },
          { ticker: "360750", name: "TIGER S&P500", targetPercent: 30 },
          { ticker: "__CASH__", name: "현금", targetPercent: 20 },
        ],
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(200);
      expect(body).toHaveLength(3);
    });

    it("기존 비중을 완전히 교체한다", async () => {
      authenticate();
      // 첫 저장
      await POST(
        createRequest("POST", "/api/target-allocations", {
          portfolioId: "test-portfolio-1",
          allocations: [
            { ticker: "069500", name: "KODEX 200", targetPercent: 100 },
          ],
        }),
      );

      // 교체
      const req = createRequest("POST", "/api/target-allocations", {
        portfolioId: "test-portfolio-1",
        allocations: [
          { ticker: "360750", name: "TIGER S&P500", targetPercent: 100 },
        ],
      });
      const { body } = await parseResponse(await POST(req));
      expect(body).toHaveLength(1);
      expect(body[0].ticker).toBe("360750");
    });

    it("합계가 100%가 아니면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/target-allocations", {
        portfolioId: "test-portfolio-1",
        allocations: [
          { ticker: "069500", name: "KODEX 200", targetPercent: 50 },
        ],
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
      expect(body.error).toContain("100%");
    });

    it("빈 allocations면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/target-allocations", {
        portfolioId: "test-portfolio-1",
        allocations: [],
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("targetPercent가 0인 항목은 저장하지 않는다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/target-allocations", {
        portfolioId: "test-portfolio-1",
        allocations: [
          { ticker: "069500", name: "KODEX 200", targetPercent: 100 },
          { ticker: "360750", name: "TIGER S&P500", targetPercent: 0 },
        ],
      });
      const { body } = await parseResponse(await POST(req));
      expect(body).toHaveLength(1);
    });
  });
});
