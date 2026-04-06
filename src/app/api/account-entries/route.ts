import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountSnapshots, accounts, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and, desc } from "drizzle-orm";

// 계좌 소유권 확인 헬퍼
function verifyAccountOwnership(accountId: string, userId: string) {
  return db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accounts.id, accountId), eq(portfolios.userId, userId)))
    .get();
}

// JSON 파싱 헬퍼
interface HoldingEntry {
  ticker: string;
  name: string;
  assetClass: string;
  amount: number;
}

interface CashFlowEntry {
  flowType: string;
  amount: number;
  memo?: string;
}

function parseHoldings(raw: string): HoldingEntry[] {
  try {
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

function parseCashFlows(raw: string | null): CashFlowEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

// 스냅샷 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");
  const portfolioId = req.nextUrl.searchParams.get("portfolioId");

  if (accountId) {
    const owner = verifyAccountOwnership(accountId, session.userId);
    if (!owner) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

    const rows = db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, accountId))
      .orderBy(desc(accountSnapshots.date))
      .all();

    return NextResponse.json(rows);
  }

  if (portfolioId) {
    const pf = db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
      .get();
    if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

    const rows = db
      .select({ snapshot: accountSnapshots, account: accounts })
      .from(accountSnapshots)
      .innerJoin(accounts, eq(accountSnapshots.accountId, accounts.id))
      .where(eq(accounts.portfolioId, portfolioId))
      .orderBy(desc(accountSnapshots.date))
      .all();

    const items = rows.map((r) => ({ ...r.snapshot, accountName: r.account.name }));
    return NextResponse.json(items);
  }

  return NextResponse.json({ error: "accountId 또는 portfolioId가 필요합니다." }, { status: 400 });
}

// 스냅샷 추가/수정 (upsert by accountId + date)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, date, holdings, cash, cashFlows, memo } = await req.json();

  const owner = verifyAccountOwnership(accountId, session.userId);
  if (!owner) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  if (!date || !Array.isArray(holdings)) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const holdingsJson = JSON.stringify(holdings);
  const cashFlowsJson = Array.isArray(cashFlows) && cashFlows.length > 0
    ? JSON.stringify(cashFlows)
    : null;

  // upsert: 같은 (accountId, date) 존재하면 업데이트
  const existing = db
    .select()
    .from(accountSnapshots)
    .where(
      and(
        eq(accountSnapshots.accountId, accountId),
        eq(accountSnapshots.date, date)
      )
    )
    .get();

  if (existing) {
    db.update(accountSnapshots)
      .set({
        holdings: holdingsJson,
        cash: cash ?? 0,
        cashFlows: cashFlowsJson,
        memo: memo ?? null,
      })
      .where(eq(accountSnapshots.id, existing.id))
      .run();
    const updated = db.select().from(accountSnapshots).where(eq(accountSnapshots.id, existing.id)).get();
    return NextResponse.json(updated);
  }

  const id = generateId();
  db.insert(accountSnapshots)
    .values({
      id,
      accountId,
      date,
      holdings: holdingsJson,
      cash: cash ?? 0,
      cashFlows: cashFlowsJson,
      memo: memo ?? null,
    })
    .run();

  const row = db.select().from(accountSnapshots).where(eq(accountSnapshots.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}

// 스냅샷 삭제
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshotId = req.nextUrl.searchParams.get("id");
  if (!snapshotId) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  // 소유권 확인
  const snap = db
    .select({ snapshot: accountSnapshots, portfolio: portfolios })
    .from(accountSnapshots)
    .innerJoin(accounts, eq(accountSnapshots.accountId, accounts.id))
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accountSnapshots.id, snapshotId), eq(portfolios.userId, session.userId)))
    .get();
  if (!snap) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });

  db.delete(accountSnapshots).where(eq(accountSnapshots.id, snapshotId)).run();
  return NextResponse.json({ ok: true });
}
