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
  get db() {
    return testDb.db;
  },
}));

const { GET, POST, DELETE } = await import("@/app/api/instruments/route");

describe("/api/instruments", () => {
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
    it("portfolioId 없이 요청하면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("GET", "/api/instruments");
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(400);
    });

    it("포트폴리오의 종목 목록을 반환한다", async () => {
      authenticate();
      // 종목 추가
      await POST(
        createRequest("POST", "/api/instruments", {
          portfolioId: "test-portfolio-1",
          ticker: "069500",
          name: "KODEX 200",
          assetClass: "domestic_equity",
        }),
      );

      const req = createRequest(
        "GET",
        "/api/instruments?portfolioId=test-portfolio-1",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].ticker).toBe("069500");
    });
  });

  describe("POST", () => {
    it("새 종목을 추가한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/instruments", {
        portfolioId: "test-portfolio-1",
        ticker: "069500",
        name: "KODEX 200",
        assetClass: "domestic_equity",
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.ticker).toBe("069500");
    });

    it("같은 (portfolioId, ticker)면 upsert한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/instruments", {
          portfolioId: "test-portfolio-1",
          ticker: "069500",
          name: "KODEX 200",
          assetClass: "domestic_equity",
        }),
      );

      const req = createRequest("POST", "/api/instruments", {
        portfolioId: "test-portfolio-1",
        ticker: "069500",
        name: "KODEX 200 (업데이트)",
        assetClass: "domestic_equity",
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(200);
      expect(body.name).toBe("KODEX 200 (업데이트)");
    });

    it("필수 필드 누락 시 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/instruments", {
        portfolioId: "test-portfolio-1",
        ticker: "069500",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("종목을 삭제한다", async () => {
      authenticate();
      const { body: created } = await parseResponse(
        await POST(
          createRequest("POST", "/api/instruments", {
            portfolioId: "test-portfolio-1",
            ticker: "069500",
            name: "KODEX 200",
            assetClass: "domestic_equity",
          }),
        ),
      );

      const req = createRequest("DELETE", `/api/instruments?id=${created.id}`);
      const { body, status } = await parseResponse(await DELETE(req));
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
    });

    it("존재하지 않는 종목 삭제 시 404를 반환한다", async () => {
      authenticate();
      const req = createRequest("DELETE", "/api/instruments?id=nonexistent");
      const { status } = await parseResponse(await DELETE(req));
      expect(status).toBe(404);
    });
  });
});
