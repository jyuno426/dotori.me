import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { prices, instruments } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { fetchEtfPrices } from "@/lib/price-fetcher";

/**
 * 종가 자동 수집 cron API
 *
 * 모든 포트폴리오에 등록된 종목의 현재가를 NAVER Finance에서 가져와 저장한다.
 * Authorization: Bearer <CRON_SECRET> 으로 보호.
 */
export async function POST(req: NextRequest) {
  // cron 인증
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // 1. 모든 포트폴리오에 등록된 고유 종목 ticker 조회
  const allInstruments = await db
    .select({ ticker: instruments.ticker })
    .from(instruments)
    .all();

  const uniqueTickers = [...new Set(allInstruments.map((i) => i.ticker))];

  if (uniqueTickers.length === 0) {
    return NextResponse.json({ message: "등록된 종목 없음", updated: 0 });
  }

  // 2. NAVER Finance에서 전체 ETF 시세 가져오기
  let allPrices;
  try {
    allPrices = await fetchEtfPrices();
  } catch (e) {
    return NextResponse.json(
      { error: "시세 데이터 수집 실패", detail: String(e) },
      { status: 502 }
    );
  }

  // 3. 등록 종목만 필터
  const tickerSet = new Set(uniqueTickers);
  const targetPrices = allPrices.filter((p) => tickerSet.has(p.ticker));

  // 4. DB에 upsert
  let updated = 0;
  for (const p of targetPrices) {
    const existing = await db
      .select()
      .from(prices)
      .where(and(eq(prices.ticker, p.ticker), eq(prices.date, p.date)))
      .get();

    if (existing) {
      await db.update(prices)
        .set({ close: p.close })
        .where(eq(prices.id, existing.id))
        .run();
    } else {
      await db.insert(prices)
        .values({ id: generateId(), ticker: p.ticker, date: p.date, close: p.close })
        .run();
    }
    updated++;
  }

  // 5. securities 마스터도 갱신 (1시간 제한 없이)
  try {
    const { fetchKrxEtfList } = await import("@/lib/krx");
    const etfs = await fetchKrxEtfList();
    const now = Math.floor(Date.now() / 1000);
    for (const etf of etfs) {
      await db.run(
        sql`INSERT INTO securities (ticker, name, market, asset_class, category, updated_at)
            VALUES (${etf.ticker}, ${etf.name}, ${etf.market}, ${etf.assetClass}, ${etf.category}, ${now})
            ON CONFLICT(ticker) DO UPDATE SET
              name = excluded.name, market = excluded.market,
              asset_class = excluded.asset_class, category = excluded.category,
              updated_at = excluded.updated_at`
      );
    }
  } catch {
    // securities 갱신 실패해도 가격 수집은 성공으로 처리
  }

  return NextResponse.json({
    message: "시세 수집 완료",
    totalTickers: uniqueTickers.length,
    pricesFetched: targetPrices.length,
    updated,
  });
}
