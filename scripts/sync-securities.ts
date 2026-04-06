/**
 * KRX ETF 마스터 데이터 동기화
 *
 * NAVER Finance API에서 전체 KRX ETF 목록을 가져와
 * securities 테이블에 upsert하고, instruments/targetAllocations의
 * 종목명이 변경된 경우 자동 갱신한다.
 *
 * 실행: node --experimental-strip-types scripts/sync-securities.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { fetchKrxEtfList } from "../src/lib/krx";

const DB_PATH = path.join(process.cwd(), "data", "dotori.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

async function main() {
  console.log("🔄 KRX ETF 데이터 동기화 시작...");

  // 1. NAVER Finance에서 ETF 목록 가져오기
  const etfs = await fetchKrxEtfList();
  console.log(`📥 ${etfs.length}개 ETF 수신`);

  // 2. securities 테이블 upsert
  const upsert = db.prepare(`
    INSERT INTO securities (ticker, name, market, asset_class, category, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      name = excluded.name,
      market = excluded.market,
      asset_class = excluded.asset_class,
      category = excluded.category,
      updated_at = excluded.updated_at
  `);

  const now = Math.floor(Date.now() / 1000);
  let upserted = 0;

  const upsertAll = db.transaction(() => {
    for (const etf of etfs) {
      upsert.run(etf.ticker, etf.name, etf.market, etf.assetClass, etf.category, now);
      upserted++;
    }
  });

  upsertAll();
  console.log(`✅ ${upserted}건 securities 테이블 동기화 완료`);

  // 3. instruments 테이블 이름 갱신
  const outdatedInstruments = db.prepare(`
    SELECT i.id, i.ticker, i.name AS old_name, s.name AS new_name
    FROM instruments i
    INNER JOIN securities s ON i.ticker = s.ticker
    WHERE i.name != s.name
  `).all() as Array<{ id: string; ticker: string; old_name: string; new_name: string }>;

  if (outdatedInstruments.length > 0) {
    const updateInstrument = db.prepare(`UPDATE instruments SET name = ? WHERE id = ?`);
    const updateAll = db.transaction(() => {
      for (const row of outdatedInstruments) {
        updateInstrument.run(row.new_name, row.id);
        console.log(`  📝 instruments: ${row.ticker} "${row.old_name}" → "${row.new_name}"`);
      }
    });
    updateAll();
    console.log(`✅ ${outdatedInstruments.length}건 instruments 이름 갱신`);
  } else {
    console.log("ℹ️  instruments 이름 변경 없음");
  }

  // 4. targetAllocations 테이블 이름 갱신
  const outdatedTargets = db.prepare(`
    SELECT t.id, t.ticker, t.name AS old_name, s.name AS new_name
    FROM target_allocations t
    INNER JOIN securities s ON t.ticker = s.ticker
    WHERE t.name != s.name
  `).all() as Array<{ id: string; ticker: string; old_name: string; new_name: string }>;

  if (outdatedTargets.length > 0) {
    const updateTarget = db.prepare(`UPDATE target_allocations SET name = ? WHERE id = ?`);
    const updateAll = db.transaction(() => {
      for (const row of outdatedTargets) {
        updateTarget.run(row.new_name, row.id);
        console.log(`  📝 targetAllocations: ${row.ticker} "${row.old_name}" → "${row.new_name}"`);
      }
    });
    updateAll();
    console.log(`✅ ${outdatedTargets.length}건 targetAllocations 이름 갱신`);
  } else {
    console.log("ℹ️  targetAllocations 이름 변경 없음");
  }

  db.close();
  console.log("🎉 동기화 완료!");
}

main().catch((err) => {
  console.error("❌ 동기화 실패:", err.message);
  process.exit(1);
});
