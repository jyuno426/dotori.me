import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedTestUser } from "../helpers/test-db";
import { cookieStore } from "../setup";
import { createRequest, parseResponse } from "../helpers/request";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  getDb: () => testDb.db,
}));

const loginRoute = await import("@/app/api/auth/login/route");
const signupRoute = await import("@/app/api/auth/signup/route");
const logoutRoute = await import("@/app/api/auth/logout/route");

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  it("새 사용자를 등록한다", async () => {
    const req = createRequest("POST", "/api/auth/signup", {
      email: "new@dotori.me",
      password: "password123",
      name: "신규유저",
    });
    const { body, status } = await parseResponse(await signupRoute.POST(req));
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(cookieStore.has("dotori_session")).toBe(true);
  });

  it("이메일 누락 시 400을 반환한다", async () => {
    const req = createRequest("POST", "/api/auth/signup", {
      password: "password123",
    });
    const { body, status } = await parseResponse(await signupRoute.POST(req));
    expect(status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("짧은 비밀번호는 400을 반환한다", async () => {
    const req = createRequest("POST", "/api/auth/signup", {
      email: "short@dotori.me",
      password: "1234567",
    });
    const { body, status } = await parseResponse(await signupRoute.POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("8자");
  });

  it("중복 이메일은 400을 반환한다", async () => {
    seedTestUser(testDb.db);
    const req = createRequest("POST", "/api/auth/signup", {
      email: "test@dotori.me",
      password: "password123",
    });
    const { body, status } = await parseResponse(await signupRoute.POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("이미 등록된");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
    seedTestUser(testDb.db);
  });

  it("올바른 자격증명으로 로그인한다", async () => {
    const req = createRequest("POST", "/api/auth/login", {
      email: "test@dotori.me",
      password: "test1234",
    });
    const { body, status } = await parseResponse(await loginRoute.POST(req));
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(cookieStore.has("dotori_session")).toBe(true);
  });

  it("잘못된 비밀번호는 401을 반환한다", async () => {
    const req = createRequest("POST", "/api/auth/login", {
      email: "test@dotori.me",
      password: "wrongpass",
    });
    const { body, status } = await parseResponse(await loginRoute.POST(req));
    expect(status).toBe(401);
    expect(body.error).toBeDefined();
  });

  it("필드 누락 시 400을 반환한다", async () => {
    const req = createRequest("POST", "/api/auth/login", {
      email: "test@dotori.me",
    });
    const { body, status } = await parseResponse(await loginRoute.POST(req));
    expect(status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  it("로그아웃하면 세션을 제거한다", async () => {
    // 먼저 로그인
    seedTestUser(testDb.db);
    const loginReq = createRequest("POST", "/api/auth/login", {
      email: "test@dotori.me",
      password: "test1234",
    });
    await loginRoute.POST(loginReq);
    expect(cookieStore.has("dotori_session")).toBe(true);

    // 로그아웃
    const { body, status } = await parseResponse(await logoutRoute.POST());
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(cookieStore.has("dotori_session")).toBe(false);
  });
});
