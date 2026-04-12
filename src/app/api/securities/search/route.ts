import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { or, like, sql } from "drizzle-orm";

// 종목 검색
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 10, 30);

  if (!q || q.length === 0) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;

  const db = getDb();

  // 테이블에 데이터가 있는지 빠르게 확인
  const count = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(securities)
    .get();

  // 데이터가 없으면 자동 동기화 시도
  if (!count || count.cnt === 0) {
    try {
      const { fetchKrxEtfList } = await import("@/lib/krx");
      const etfs = await fetchKrxEtfList();
      const now = Math.floor(Date.now() / 1000);
      for (const etf of etfs) {
        await db.run(
          sql`INSERT INTO securities (ticker, name, market, asset_class, category, updated_at)
              VALUES (${etf.ticker}, ${etf.name}, ${etf.market}, ${etf.assetClass}, ${etf.category}, ${now})
              ON CONFLICT(ticker) DO UPDATE SET
                name = excluded.name,
                market = excluded.market,
                asset_class = excluded.asset_class,
                category = excluded.category,
                updated_at = excluded.updated_at`
        );
      }
    } catch {
      // sync 실패해도 검색은 계속 진행
    }
  }

  const rows = await db
    .select()
    .from(securities)
    .where(
      or(
        sql`LOWER(${securities.name}) LIKE LOWER(${pattern})`,
        like(securities.ticker, pattern)
      )
    )
    .limit(limit)
    .all();

  return NextResponse.json(rows);
}
