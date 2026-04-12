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
  getDb: () => testDb.db,
}));

const { GET, PUT } = await import("@/app/api/auth/profile/route");

describe("/api/auth/profile", () => {
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
      const req = createRequest("GET", "/api/auth/profile");
      const { status } = await parseResponse(await GET());
      expect(status).toBe(401);
    });

    it("프로필 정보를 반환한다", async () => {
      authenticate();
      const { body, status } = await parseResponse(await GET());
      expect(status).toBe(200);
      expect(body.email).toBe("test@dotori.me");
      expect(body.name).toBe("테스트유저");
    });
  });

  describe("PUT", () => {
    it("인증 없이 요청하면 401을 반환한다", async () => {
      const req = createRequest("PUT", "/api/auth/profile", { name: "새이름" });
      const { status } = await parseResponse(await PUT(req));
      expect(status).toBe(401);
    });

    it("이름을 변경한다", async () => {
      authenticate();
      const req = createRequest("PUT", "/api/auth/profile", { name: "새이름" });
      const { body, status } = await parseResponse(await PUT(req));
      expect(status).toBe(200);
      expect(body.name).toBe("새이름");
    });

    it("빈 이름은 400을 반환한다", async () => {
      authenticate();
      const req = createRequest("PUT", "/api/auth/profile", { name: "" });
      const { status } = await parseResponse(await PUT(req));
      expect(status).toBe(400);
    });

    it("50자 초과 이름은 400을 반환한다", async () => {
      authenticate();
      const longName = "가".repeat(51);
      const req = createRequest("PUT", "/api/auth/profile", { name: longName });
      const { status } = await parseResponse(await PUT(req));
      expect(status).toBe(400);
    });

    it("이름 앞뒤 공백을 제거한다", async () => {
      authenticate();
      const req = createRequest("PUT", "/api/auth/profile", { name: "  공백이름  " });
      const { body, status } = await parseResponse(await PUT(req));
      expect(status).toBe(200);
      expect(body.name).toBe("공백이름");
    });
  });
});
