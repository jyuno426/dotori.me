import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities, instruments, targetAllocations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { fetchKrxEtfList } from "@/lib/krx";
import { eq, sql, ne, and } from "drizzle-orm";

// 종목 마스터 동기화
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // 1시간 이내 재실행 방지
  const latest = await db
    .select({ maxUpdated: sql<number>`MAX(updated_at)` })
    .from(securities)
    .get();

  if (latest?.maxUpdated) {
    const lastSync = latest.maxUpdated * 1000; // seconds → ms (SQLite stores as seconds)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (lastSync > oneHourAgo) {
      return NextResponse.json(
        { error: "1시간 이내에 이미 동기화되었습니다." },
        { status: 429 }
      );
    }
  }

  // KRX ETF 목록 가져오기
  const etfs = await fetchKrxEtfList();

  // securities upsert
  const now = Math.floor(Date.now() / 1000);
  let synced = 0;

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
    synced++;
  }

  // instruments 이름 갱신
  let namesUpdated = 0;
  const outdated = await db
    .select({
      instrumentId: instruments.id,
      newName: securities.name,
    })
    .from(instruments)
    .innerJoin(securities, eq(instruments.ticker, securities.ticker))
    .where(ne(instruments.name, securities.name))
    .all();

  for (const row of outdated) {
    await db.update(instruments)
      .set({ name: row.newName })
      .where(eq(instruments.id, row.instrumentId))
      .run();
    namesUpdated++;
  }

  // targetAllocations 이름 갱신
  const outdatedTargets = await db
    .select({
      targetId: targetAllocations.id,
      newName: securities.name,
    })
    .from(targetAllocations)
    .innerJoin(securities, eq(targetAllocations.ticker, securities.ticker))
    .where(ne(targetAllocations.name, securities.name))
    .all();

  for (const row of outdatedTargets) {
    await db.update(targetAllocations)
      .set({ name: row.newName })
      .where(eq(targetAllocations.id, row.targetId))
      .run();
    namesUpdated++;
  }

  return NextResponse.json({ synced, namesUpdated });
}
