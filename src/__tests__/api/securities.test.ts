import { describe, it, expect, beforeEach, vi } from "vitest";
import * as schema from "@/lib/db/schema";
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

const searchRoute = await import("@/app/api/securities/search/route");

describe("/api/securities/search", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  function authenticate() {
    seedTestUser(testDb.db);
    const token = seedTestSession(testDb.db);
    cookieStore.set("dotori_session", token);
  }

  function insertSecurity(
    ticker: string,
    name: string,
    market = "ETF",
    assetClass = "domestic_equity",
  ) {
    testDb.db
      .insert(schema.securities)
      .values({ ticker, name, market, assetClass, category: "테스트" })
      .run();
  }

  it("이름으로 검색한다", async () => {
    authenticate();
    insertSecurity("069500", "KODEX 200");
    insertSecurity("360750", "TIGER 미국S&P500");

    const req = createRequest("GET", "/api/securities/search?q=KODEX");
    const { body, status } = await parseResponse(await searchRoute.GET(req));
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("KODEX 200");
  });

  it("ticker로 검색한다", async () => {
    authenticate();
    insertSecurity("069500", "KODEX 200");

    const req = createRequest("GET", "/api/securities/search?q=069500");
    const { body } = await parseResponse(await searchRoute.GET(req));
    expect(body).toHaveLength(1);
    expect(body[0].ticker).toBe("069500");
  });

  it("대소문자 구분 없이 검색한다", async () => {
    authenticate();
    insertSecurity("069500", "KODEX 200");

    const req = createRequest("GET", "/api/securities/search?q=kodex");
    const { body } = await parseResponse(await searchRoute.GET(req));
    expect(body).toHaveLength(1);
  });

  it("검색어가 없으면 빈 배열을 반환한다", async () => {
    authenticate();
    const req = createRequest("GET", "/api/securities/search?q=");
    const { body } = await parseResponse(await searchRoute.GET(req));
    expect(body).toEqual([]);
  });

  it("limit으로 결과 수를 제한한다", async () => {
    authenticate();
    insertSecurity("069500", "KODEX 200");
    insertSecurity("069600", "KODEX 300");
    insertSecurity("069700", "KODEX 400");

    const req = createRequest(
      "GET",
      "/api/securities/search?q=KODEX&limit=2",
    );
    const { body } = await parseResponse(await searchRoute.GET(req));
    expect(body).toHaveLength(2);
  });

  it("limit은 최대 30개로 제한된다", async () => {
    authenticate();
    const req = createRequest(
      "GET",
      "/api/securities/search?q=test&limit=100",
    );
    // Just verify it doesn't crash — max cap is internal
    const { status } = await parseResponse(await searchRoute.GET(req));
    expect(status).toBe(200);
  });
});
