import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { prices } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and, desc } from "drizzle-orm";

// 종목 가격 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticker = req.nextUrl.searchParams.get("ticker");
  const tickers = req.nextUrl.searchParams.get("tickers"); // 쉼표 구분

  const db = getDb();

  if (ticker) {
    const row = await db
      .select()
      .from(prices)
      .where(eq(prices.ticker, ticker))
      .orderBy(desc(prices.date))
      .limit(1)
      .get();
    return NextResponse.json(row ?? null);
  }

  if (tickers) {
    const tickerList = tickers.split(",").map((t) => t.trim());
    const result: Record<string, { close: number; date: string }> = {};
    for (const t of tickerList) {
      const row = await db
        .select()
        .from(prices)
        .where(eq(prices.ticker, t))
        .orderBy(desc(prices.date))
        .limit(1)
        .get();
      if (row) result[t] = { close: row.close, date: row.date };
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "ticker 또는 tickers가 필요합니다." }, { status: 400 });
}

// 가격 입력 (upsert: 같은 ticker+date면 업데이트)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // 일괄 입력 지원: { items: [{ticker, date, close}] } 또는 단건 { ticker, date, close }
  const items = Array.isArray(body.items) ? body.items : [body];

  const db = getDb();
  const results = [];
  for (const { ticker, date, close } of items) {
    if (!ticker || !date || close == null) continue;

    const existing = await db
      .select()
      .from(prices)
      .where(and(eq(prices.ticker, ticker), eq(prices.date, date)))
      .get();

    if (existing) {
      await db.update(prices)
        .set({ close })
        .where(eq(prices.id, existing.id))
        .run();
      results.push({ ticker, date, close, updated: true });
    } else {
      const id = generateId();
      await db.insert(prices)
        .values({ id, ticker, date, close })
        .run();
      results.push({ ticker, date, close, created: true });
    }
  }

  return NextResponse.json(results, { status: 201 });
}
