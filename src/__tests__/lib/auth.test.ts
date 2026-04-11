import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  createTestDb,
  seedTestUser,
  seedTestSession,
} from "../helpers/test-db";
import { cookieStore } from "../setup";

// 테스트마다 새 DB를 사용하도록 db 모듈을 모킹
let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  getDb: () => testDb.db,
}));

// auth 모듈을 db mock 후에 import
const { signUp, signIn, createSession, getSession, destroySession } =
  await import("@/lib/auth");

describe("auth", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  describe("signUp", () => {
    it("새 사용자를 생성한다", async () => {
      const result = await signUp("new@dotori.me", "password123", "신규유저");
      expect(result).toMatchObject({
        email: "new@dotori.me",
        name: "신규유저",
      });
      expect(result.id).toBeDefined();

      const user = testDb.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, "new@dotori.me"))
        .get();
      expect(user).toBeDefined();
      expect(user!.passwordHash).toContain(":");
    });

    it("이름 없이도 생성할 수 있다", async () => {
      const result = await signUp("noname@dotori.me", "password123");
      expect(result.name).toBeFalsy();
    });

    it("중복 이메일이면 에러를 던진다", async () => {
      seedTestUser(testDb.db);
      await expect(signUp("test@dotori.me", "password123")).rejects.toThrow(
        "이미 등록된 이메일입니다.",
      );
    });
  });

  describe("signIn", () => {
    beforeEach(() => {
      seedTestUser(testDb.db);
    });

    it("올바른 자격증명으로 로그인한다", async () => {
      const result = await signIn("test@dotori.me", "test1234");
      expect(result).toMatchObject({
        id: "test-user-1",
        email: "test@dotori.me",
        name: "테스트유저",
      });
    });

    it("잘못된 비밀번호면 에러를 던진다", async () => {
      await expect(signIn("test@dotori.me", "wrongpass")).rejects.toThrow(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    });

    it("존재하지 않는 이메일이면 에러를 던진다", async () => {
      await expect(signIn("no@dotori.me", "test1234")).rejects.toThrow(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    });
  });

  describe("createSession", () => {
    beforeEach(() => {
      seedTestUser(testDb.db);
    });

    it("세션 토큰을 생성하고 쿠키에 설정한다", async () => {
      const token = await createSession("test-user-1");
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      // DB에 세션이 저장되어야 한다
      const session = testDb.db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .get();
      expect(session).toBeDefined();
      expect(session!.userId).toBe("test-user-1");

      // 쿠키에 설정되어야 한다
      expect(cookieStore.get("dotori_session")).toBe(token);
    });
  });

  describe("getSession", () => {
    beforeEach(() => {
      seedTestUser(testDb.db);
    });

    it("유효한 세션의 사용자 정보를 반환한다", async () => {
      const token = seedTestSession(testDb.db);
      cookieStore.set("dotori_session", token);

      const session = await getSession();
      expect(session).toMatchObject({
        userId: "test-user-1",
        email: "test@dotori.me",
        name: "테스트유저",
      });
    });

    it("쿠키가 없으면 null을 반환한다", async () => {
      const session = await getSession();
      expect(session).toBeNull();
    });

    it("만료된 세션이면 null을 반환하고 세션을 삭제한다", async () => {
      testDb.db
        .insert(schema.sessions)
        .values({
          token: "expired-token",
          userId: "test-user-1",
          expiresAt: Date.now() - 1000, // 과거 시간
        })
        .run();
      cookieStore.set("dotori_session", "expired-token");

      const session = await getSession();
      expect(session).toBeNull();

      // 세션이 DB에서 삭제되어야 한다
      const dbSession = testDb.db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, "expired-token"))
        .get();
      expect(dbSession).toBeUndefined();
    });
  });

  describe("destroySession", () => {
    beforeEach(() => {
      seedTestUser(testDb.db);
    });

    it("세션을 DB와 쿠키에서 삭제한다", async () => {
      const token = seedTestSession(testDb.db);
      cookieStore.set("dotori_session", token);

      await destroySession();

      expect(cookieStore.has("dotori_session")).toBe(false);
      const session = testDb.db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .get();
      expect(session).toBeUndefined();
    });

    it("세션이 없어도 에러 없이 동작한다", async () => {
      await expect(destroySession()).resolves.not.toThrow();
    });
  });
});
