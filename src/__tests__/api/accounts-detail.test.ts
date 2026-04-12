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

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  getDb: () => testDb.db,
}));

const { GET, DELETE } = await import("@/app/api/accounts/[id]/route");

function createGetRequest(id: string) {
  const req = new NextRequest(new URL(`http://localhost:3000/api/accounts/${id}`));
  const params = Promise.resolve({ id });
  return { req, params };
}

describe("/api/accounts/[id]", () => {
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

  it("계좌 단건을 조회한다", async () => {
    authenticate();
    const { req, params } = createGetRequest("test-account-1");
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("test-account-1");
    expect(body.name).toBe("테스트 IRP");
    expect(body.portfolioId).toBe("test-portfolio-1");
    expect(body.portfolioName).toBe("테스트 포트폴리오");
  });

  it("인증 없이 요청하면 401을 반환한다", async () => {
    const { req, params } = createGetRequest("test-account-1");
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("존재하지 않는 계좌는 404를 반환한다", async () => {
    authenticate();
    const { req, params } = createGetRequest("nonexistent");
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("다른 사용자의 계좌는 404를 반환한다", async () => {
    authenticate();
    // 다른 사용자의 포트폴리오+계좌
    const { users, portfolios, accounts } = await import("@/lib/db/schema");
    const crypto = require("crypto");
    const salt = "b".repeat(32);
    const hash = crypto.pbkdf2Sync("test1234", salt, 100000, 64, "sha512").toString("hex");

    testDb.db.insert(users).values({
      id: "other-user",
      email: "other@dotori.me",
      name: "다른유저",
      passwordHash: `${salt}:${hash}`,
    }).run();
    testDb.db.insert(portfolios).values({
      id: "other-portfolio",
      userId: "other-user",
      name: "다른 포트폴리오",
    }).run();
    testDb.db.insert(accounts).values({
      id: "other-account",
      portfolioId: "other-portfolio",
      name: "다른 계좌",
      accountType: "brokerage",
    }).run();

    const { req, params } = createGetRequest("other-account");
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("계좌를 삭제한다", async () => {
    authenticate();
    const { req, params } = createGetRequest("test-account-1");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);

    // 삭제 후 조회 시 404
    const { req: req2, params: params2 } = createGetRequest("test-account-1");
    const res2 = await GET(req2, { params: params2 });
    expect(res2.status).toBe(404);
  });

  it("인증 없이 삭제하면 401을 반환한다", async () => {
    const { req, params } = createGetRequest("test-account-1");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it("존재하지 않는 계좌 삭제 시 404를 반환한다", async () => {
    authenticate();
    const { req, params } = createGetRequest("nonexistent");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });
});
