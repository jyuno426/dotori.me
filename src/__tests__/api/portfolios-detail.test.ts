import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTestDb,
  seedTestUser,
  seedTestPortfolio,
  seedTestAccount,
  seedTestSession,
} from "../helpers/test-db";
import { cookieStore } from "../setup";
import { NextRequest } from "next/server";
import crypto from "node:crypto";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  getDb: () => testDb.db,
}));

const { GET, DELETE } = await import("@/app/api/portfolios/[id]/route");

function createReq(id: string) {
  const req = new NextRequest(
    new URL(`http://localhost:3000/api/portfolios/${id}`),
  );
  const params = Promise.resolve({ id });
  return { req, params };
}

describe("/api/portfolios/[id]", () => {
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
    it("포트폴리오 단건을 조회한다", async () => {
      authenticate();
      const { req, params } = createReq("test-portfolio-1");
      const res = await GET(req, { params });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe("test-portfolio-1");
      expect(body.name).toBe("테스트 포트폴리오");
    });

    it("인증 없이 요청하면 401을 반환한다", async () => {
      const { req, params } = createReq("test-portfolio-1");
      const res = await GET(req, { params });
      expect(res.status).toBe(401);
    });

    it("존재하지 않는 포트폴리오는 404를 반환한다", async () => {
      authenticate();
      const { req, params } = createReq("nonexistent");
      const res = await GET(req, { params });
      expect(res.status).toBe(404);
    });

    it("다른 사용자의 포트폴리오는 404를 반환한다", async () => {
      authenticate();
      const { users, portfolios } = await import("@/lib/db/schema");
      const salt = "b".repeat(32);
      const hash = crypto
        .pbkdf2Sync("test1234", salt, 100000, 64, "sha512")
        .toString("hex");

      testDb.db
        .insert(users)
        .values({
          id: "other-user",
          email: "other@dotori.me",
          name: "다른유저",
          passwordHash: `${salt}:${hash}`,
        })
        .run();
      testDb.db
        .insert(portfolios)
        .values({
          id: "other-portfolio",
          userId: "other-user",
          name: "남의 포트폴리오",
          description: null,
        })
        .run();

      const { req, params } = createReq("other-portfolio");
      const res = await GET(req, { params });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE", () => {
    it("포트폴리오를 삭제한다", async () => {
      authenticate();
      const { req, params } = createReq("test-portfolio-1");
      const res = await DELETE(req, { params });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);

      // 실제 DB에서 제거되었는지 확인
      const { portfolios } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const remaining = await testDb.db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, "test-portfolio-1"))
        .get();
      expect(remaining).toBeUndefined();
    });

    it("연결된 계좌도 cascade로 함께 삭제된다", async () => {
      authenticate();
      seedTestAccount(testDb.db);

      const { req, params } = createReq("test-portfolio-1");
      const res = await DELETE(req, { params });
      expect(res.status).toBe(200);

      const { accounts } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const remaining = await testDb.db
        .select()
        .from(accounts)
        .where(eq(accounts.portfolioId, "test-portfolio-1"))
        .all();
      expect(remaining).toHaveLength(0);
    });

    it("인증 없이 요청하면 401을 반환한다", async () => {
      const { req, params } = createReq("test-portfolio-1");
      const res = await DELETE(req, { params });
      expect(res.status).toBe(401);
    });

    it("존재하지 않는 포트폴리오는 404를 반환한다", async () => {
      authenticate();
      const { req, params } = createReq("nonexistent");
      const res = await DELETE(req, { params });
      expect(res.status).toBe(404);
    });

    it("다른 사용자의 포트폴리오는 삭제되지 않는다 (404)", async () => {
      authenticate();
      const { users, portfolios } = await import("@/lib/db/schema");
      const salt = "b".repeat(32);
      const hash = crypto
        .pbkdf2Sync("test1234", salt, 100000, 64, "sha512")
        .toString("hex");

      testDb.db
        .insert(users)
        .values({
          id: "other-user",
          email: "other@dotori.me",
          name: "다른유저",
          passwordHash: `${salt}:${hash}`,
        })
        .run();
      testDb.db
        .insert(portfolios)
        .values({
          id: "other-portfolio",
          userId: "other-user",
          name: "남의 포트폴리오",
          description: null,
        })
        .run();

      const { req, params } = createReq("other-portfolio");
      const res = await DELETE(req, { params });
      expect(res.status).toBe(404);

      // 남의 포트폴리오는 그대로 남아있어야 함
      const { eq } = await import("drizzle-orm");
      const survivor = await testDb.db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, "other-portfolio"))
        .get();
      expect(survivor).toBeDefined();
    });
  });
});
