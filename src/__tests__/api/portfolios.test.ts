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

const { GET, POST } = await import("@/app/api/portfolios/route");

describe("/api/portfolios", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  function authenticate() {
    seedTestUser(testDb.db);
    const token = seedTestSession(testDb.db);
    cookieStore.set("dotori_session", token);
  }

  describe("GET", () => {
    it("인증 없이 요청하면 401을 반환한다", async () => {
      const { status } = await parseResponse(await GET());
      expect(status).toBe(401);
    });

    it("사용자의 포트폴리오 목록을 반환한다", async () => {
      authenticate();
      seedTestPortfolio(testDb.db);

      const { body, status } = await parseResponse(await GET());
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("테스트 포트폴리오");
    });

    it("다른 사용자의 포트폴리오는 포함하지 않는다", async () => {
      authenticate();
      // 다른 사용자의 포트폴리오
      testDb.db
        .insert(
          (await import("@/lib/db/schema")).users,
        )
        .values({
          id: "other-user",
          email: "other@dotori.me",
          name: "다른유저",
          passwordHash: "salt:hash",
        })
        .run();

      testDb.db
        .insert(
          (await import("@/lib/db/schema")).portfolios,
        )
        .values({
          id: "other-portfolio",
          userId: "other-user",
          name: "다른 포트폴리오",
        })
        .run();

      seedTestPortfolio(testDb.db);

      const { body } = await parseResponse(await GET());
      expect(body).toHaveLength(1);
      expect(body[0].userId).toBe("test-user-1");
    });
  });

  describe("POST", () => {
    it("새 포트폴리오를 생성한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/portfolios", {
        name: "새 포트폴리오",
        description: "설명",
      });
      const { body, status } = await parseResponse(await POST(req));
      expect(status).toBe(201);
      expect(body.name).toBe("새 포트폴리오");
      expect(body.description).toBe("설명");
      expect(body.userId).toBe("test-user-1");
    });

    it("이름 없이 생성하면 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("POST", "/api/portfolios", {
        description: "설명만",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("인증 없이 생성하면 401을 반환한다", async () => {
      const req = createRequest("POST", "/api/portfolios", {
        name: "테스트",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(401);
    });
  });
});
