import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashBalances, accounts, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and, desc } from "drizzle-orm";

// 예수금 잔액 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");
  const portfolioId = req.nextUrl.searchParams.get("portfolioId");

  if (accountId) {
    // 최신 잔액 1건
    const row = db
      .select()
      .from(cashBalances)
      .where(eq(cashBalances.accountId, accountId))
      .orderBy(desc(cashBalances.date))
      .limit(1)
      .get();
    return NextResponse.json(row ?? null);
  }

  if (portfolioId) {
    // 포트폴리오 소유권 확인
    const pf = db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
      .get();
    if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

    // 각 계좌별 최신 예수금
    const accs = db
      .select()
      .from(accounts)
      .where(eq(accounts.portfolioId, portfolioId))
      .all();

    const balances = accs.map((acc) => {
      const latest = db
        .select()
        .from(cashBalances)
        .where(eq(cashBalances.accountId, acc.id))
        .orderBy(desc(cashBalances.date))
        .limit(1)
        .get();
      return {
        accountId: acc.id,
        accountName: acc.name,
        balance: latest?.balance ?? 0,
        date: latest?.date ?? null,
      };
    });

    const total = balances.reduce((s, b) => s + b.balance, 0);
    return NextResponse.json({ balances, total });
  }

  return NextResponse.json({ error: "accountId 또는 portfolioId가 필요합니다." }, { status: 400 });
}

// 예수금 잔액 입력/오버라이드 (같은 계좌+날짜면 업데이트)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, date, balance } = await req.json();

  // 소유권 확인
  const account = db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accounts.id, accountId), eq(portfolios.userId, session.userId)))
    .get();
  if (!account) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  if (!date || balance == null) {
    return NextResponse.json({ error: "날짜와 잔액을 입력해주세요." }, { status: 400 });
  }

  // upsert: 같은 계좌+날짜면 업데이트
  const existing = db
    .select()
    .from(cashBalances)
    .where(and(eq(cashBalances.accountId, accountId), eq(cashBalances.date, date)))
    .get();

  if (existing) {
    db.update(cashBalances)
      .set({ balance })
      .where(eq(cashBalances.id, existing.id))
      .run();
    const updated = db.select().from(cashBalances).where(eq(cashBalances.id, existing.id)).get();
    return NextResponse.json(updated);
  }

  const id = generateId();
  db.insert(cashBalances)
    .values({ id, accountId, date, balance })
    .run();

  const row = db.select().from(cashBalances).where(eq(cashBalances.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}
