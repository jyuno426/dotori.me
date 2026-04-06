import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTestDb,
  seedTestUser,
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

const { GET, POST } = await import("@/app/api/prices/route");

describe("/api/prices", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  function authenticate() {
    seedTestUser(testDb.db);
    const token = seedTestSession(testDb.db);
    cookieStore.set("dotori_session", token);
  }

  describe("POST", () => {
    it("단건 가격을 입력한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/prices", {
        ticker: "069500",
        date: "2025-01-15",
        close: 35000,
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body).toHaveLength(1);
      expect(body[0].created).toBe(true);
    });

    it("일괄 가격을 입력한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/prices", {
        items: [
          { ticker: "069500", date: "2025-01-15", close: 35000 },
          { ticker: "360750", date: "2025-01-15", close: 18000 },
        ],
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body).toHaveLength(2);
    });

    it("같은 (ticker, date)면 업데이트한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/prices", {
          ticker: "069500",
          date: "2025-01-15",
          close: 35000,
        }),
      );

      const req = createRequest("POST", "/api/prices", {
        ticker: "069500",
        date: "2025-01-15",
        close: 36000,
      });
      const { body } = await parseResponse(await POST(req));
      expect(body[0].updated).toBe(true);
      expect(body[0].close).toBe(36000);
    });
  });

  describe("GET", () => {
    it("단일 ticker의 최신 가격을 조회한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/prices", {
          items: [
            { ticker: "069500", date: "2025-01-15", close: 35000 },
            { ticker: "069500", date: "2025-01-20", close: 36000 },
          ],
        }),
      );

      const req = createRequest("GET", "/api/prices?ticker=069500");
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body.close).toBe(36000);
      expect(body.date).toBe("2025-01-20");
    });

    it("복수 tickers의 가격을 조회한다", async () => {
      authenticate();
      await POST(
        createRequest("POST", "/api/prices", {
          items: [
            { ticker: "069500", date: "2025-01-15", close: 35000 },
            { ticker: "360750", date: "2025-01-15", close: 18000 },
          ],
        }),
      );

      const req = createRequest("GET", "/api/prices?tickers=069500,360750");
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body["069500"].close).toBe(35000);
      expect(body["360750"].close).toBe(18000);
    });

    it("존재하지 않는 ticker는 null을 반환한다", async () => {
      authenticate();
      const req = createRequest("GET", "/api/prices?ticker=999999");
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body).toBeNull();
    });

    it("ticker, tickers 모두 없으면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("GET", "/api/prices");
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(400);
    });
  });
});
