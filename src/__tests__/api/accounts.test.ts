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
  getDb: () => testDb.db,
}));

const { GET, POST } = await import("@/app/api/accounts/route");

describe("/api/accounts", () => {
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
    it("인증 없이 요청하면 401을 반환한다", async () => {
      const req = createRequest("GET", "/api/accounts");
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(401);
    });

    it("portfolioId로 필터링된 계좌를 반환한다", async () => {
      authenticate();
      seedTestAccount(testDb.db);

      const req = createRequest(
        "GET",
        "/api/accounts?portfolioId=test-portfolio-1",
      );
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("테스트 IRP");
    });

    it("모든 계좌를 포트폴리오 이름과 함께 반환한다", async () => {
      authenticate();
      seedTestAccount(testDb.db);

      const req = createRequest("GET", "/api/accounts");
      const { body, status } = await parseResponse(await GET(req));
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].portfolioName).toBe("테스트 포트폴리오");
    });

    it("존재하지 않는 포트폴리오는 404를 반환한다", async () => {
      authenticate();
      const req = createRequest(
        "GET",
        "/api/accounts?portfolioId=nonexistent",
      );
      const { status } = await parseResponse(await GET(req));
      expect(status).toBe(404);
    });
  });

  describe("POST", () => {
    it("새 계좌를 생성한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/accounts", {
        portfolioId: "test-portfolio-1",
        name: "새 계좌",
        broker: "키움증권",
        accountType: "brokerage",
        owner: "본인",
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.name).toBe("새 계좌");
      expect(body.accountType).toBe("brokerage");
    });

    it("필수 필드 누락 시 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/accounts", {
        portfolioId: "test-portfolio-1",
        name: "계좌",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("다른 사용자의 포트폴리오에 생성하면 404를 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/accounts", {
        portfolioId: "nonexistent",
        name: "계좌",
        accountType: "irp",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(404);
    });
  });
});
