import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
  createTestDb,
  seedTestUser,
  seedTestSession,
} from "../helpers/test-db";
import { cookieStore } from "../setup";
import { createRequest, parseResponse } from "../helpers/request";
import {
  portfolios,
  instruments,
  targetAllocations,
  accounts,
} from "@/lib/db/schema";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  getDb: () => testDb.db,
}));

const { POST } = await import("@/app/api/onboarding/from-preset/route");

describe("/api/onboarding/from-preset", () => {
  beforeEach(() => {
    testDb = createTestDb();
    cookieStore.clear();
  });

  function authenticate() {
    seedTestUser(testDb.db);
    const token = seedTestSession(testDb.db);
    cookieStore.set("dotori_session", token);
  }

  it("로그인 안 한 상태면 401", async () => {
    const req = createRequest("POST", "/api/onboarding/from-preset", {
      presetKey: "global-60-40",
    });
    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(401);
  });

  it("프리셋 키가 없으면 400", async () => {
    authenticate();
    const req = createRequest("POST", "/api/onboarding/from-preset", {});
    const { body, status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("프리셋");
  });

  it("유효하지 않은 프리셋 키도 400", async () => {
    authenticate();
    const req = createRequest("POST", "/api/onboarding/from-preset", {
      presetKey: "invalid-preset",
    });
    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
  });

  it("글로벌 60/40으로 포트폴리오·종목·목표비중·계좌 원샷 생성", async () => {
    authenticate();
    const req = createRequest("POST", "/api/onboarding/from-preset", {
      presetKey: "global-60-40",
    });
    const { body, status } = await parseResponse(await POST(req));

    expect(status).toBe(201);
    expect(body.portfolioId).toBeTruthy();
    expect(body.accountId).toBeTruthy();
    expect(body.presetKey).toBe("global-60-40");

    // 포트폴리오 1개
    const pfs = await testDb.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, "test-user-1"))
      .all();
    expect(pfs).toHaveLength(1);
    expect(pfs[0].name).toContain("글로벌 60/40");

    // 글로벌 60/40은 6개 자산군 (kr-stock, us-stock, dev-stock, em-stock, kr-bond, us-bond) — 비중 0인 gold·alt 제외
    const insts = await testDb.db
      .select()
      .from(instruments)
      .where(eq(instruments.portfolioId, pfs[0].id))
      .all();
    expect(insts).toHaveLength(6);

    const targets = await testDb.db
      .select()
      .from(targetAllocations)
      .where(eq(targetAllocations.portfolioId, pfs[0].id))
      .all();
    expect(targets).toHaveLength(6);

    // 합계 100%
    const total = targets.reduce((s, t) => s + t.targetPercent, 0);
    expect(total).toBeCloseTo(100, 1);

    // 계좌 1개
    const accs = await testDb.db
      .select()
      .from(accounts)
      .where(eq(accounts.portfolioId, pfs[0].id))
      .all();
    expect(accs).toHaveLength(1);
    expect(accs[0].accountType).toBe("brokerage");
  });

  it("영구포트폴리오는 7개 자산군 (kr-stock 제외)", async () => {
    authenticate();
    const req = createRequest("POST", "/api/onboarding/from-preset", {
      presetKey: "permanent",
    });
    const { body } = await parseResponse(await POST(req));

    const insts = await testDb.db
      .select()
      .from(instruments)
      .where(eq(instruments.portfolioId, body.portfolioId))
      .all();
    expect(insts).toHaveLength(7);

    const tickers = insts.map((i) => i.ticker).sort();
    expect(tickers).not.toContain("069500"); // KODEX 200 제외 (kr-stock 0%)
  });

  it("30대 성장형은 8개 자산군 모두 포함", async () => {
    authenticate();
    const req = createRequest("POST", "/api/onboarding/from-preset", {
      presetKey: "growth-30s",
    });
    const { body } = await parseResponse(await POST(req));

    const insts = await testDb.db
      .select()
      .from(instruments)
      .where(eq(instruments.portfolioId, body.portfolioId))
      .all();
    expect(insts).toHaveLength(8);
  });

  it("portfolioName/accountName/accountType 커스텀 적용", async () => {
    authenticate();
    const req = createRequest("POST", "/api/onboarding/from-preset", {
      presetKey: "k-allweather",
      portfolioName: "내 노후 자금",
      accountName: "키움 ISA",
      accountType: "isa",
    });
    const { body } = await parseResponse(await POST(req));

    const pf = await testDb.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, body.portfolioId))
      .get();
    expect(pf?.name).toBe("내 노후 자금");

    const acc = await testDb.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, body.accountId))
      .get();
    expect(acc?.name).toBe("키움 ISA");
    expect(acc?.accountType).toBe("isa");
  });

  it("같은 사용자가 두 번 호출하면 새 포트폴리오 두 개", async () => {
    authenticate();
    const make = () =>
      POST(
        createRequest("POST", "/api/onboarding/from-preset", {
          presetKey: "global-60-40",
        }),
      );
    await make();
    await make();

    const pfs = await testDb.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, "test-user-1"))
      .all();
    expect(pfs).toHaveLength(2);
  });
});
