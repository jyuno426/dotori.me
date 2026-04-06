import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountEntries, accounts, portfolios } from "@/lib/db/schema";
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

// 계좌 기록 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");
  const portfolioId = req.nextUrl.searchParams.get("portfolioId");
  const type = req.nextUrl.searchParams.get("type"); // 'holding' | 'cash' | 'cash_flow' | null(전체)

  if (accountId) {
    const owner = verifyAccountOwnership(accountId, session.userId);
    if (!owner) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

    let query = db
      .select()
      .from(accountEntries)
      .where(
        type
          ? and(eq(accountEntries.accountId, accountId), eq(accountEntries.type, type))
          : eq(accountEntries.accountId, accountId)
      )
      .orderBy(desc(accountEntries.date))
      .all();

    // cash_flow 타입일 때 summary 포함
    if (type === "cash_flow") {
      const totalDeposit = query.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
      const totalWithdrawal = query.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);
      return NextResponse.json({
        items: query,
        summary: { totalDeposit, totalWithdrawal, net: totalDeposit + totalWithdrawal },
      });
    }

    // cash 타입일 때 최신 1건만
    if (type === "cash") {
      return NextResponse.json(query[0] ?? null);
    }

    return NextResponse.json(query);
  }

  if (portfolioId) {
    const pf = db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
      .get();
    if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

    const rows = db
      .select({ entry: accountEntries, account: accounts })
      .from(accountEntries)
      .innerJoin(accounts, eq(accountEntries.accountId, accounts.id))
      .where(
        type
          ? and(eq(accounts.portfolioId, portfolioId), eq(accountEntries.type, type))
          : eq(accounts.portfolioId, portfolioId)
      )
      .orderBy(desc(accountEntries.date))
      .all();

    const items = rows.map((r) => ({ ...r.entry, accountName: r.account.name }));

    // cash 타입: 각 계좌별 최신 예수금
    if (type === "cash") {
      const accs = db
        .select()
        .from(accounts)
        .where(eq(accounts.portfolioId, portfolioId))
        .all();

      const balances = accs.map((acc) => {
        const latest = items.find((i) => i.accountId === acc.id);
        return {
          accountId: acc.id,
          accountName: acc.name,
          balance: latest?.amount ?? 0,
          date: latest?.date ?? null,
        };
      });
      const total = balances.reduce((s, b) => s + b.balance, 0);
      return NextResponse.json({ balances, total });
    }

    // cash_flow 타입: 전체 내역 + summary
    if (type === "cash_flow") {
      const totalDeposit = items.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
      const totalWithdrawal = items.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);
      return NextResponse.json({
        items,
        summary: { totalDeposit, totalWithdrawal, net: totalDeposit + totalWithdrawal },
      });
    }

    return NextResponse.json(items);
  }

  return NextResponse.json({ error: "accountId 또는 portfolioId가 필요합니다." }, { status: 400 });
}

// 계좌 기록 추가/수정 (upsert: accountId + date + ticker)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, date, type, ticker, name, assetClass, amount, memo } = await req.json();

  const owner = verifyAccountOwnership(accountId, session.userId);
  if (!owner) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  if (!date || !type || !ticker || !name || amount == null) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  // upsert: 같은 (accountId, date, ticker) 존재하면 업데이트
  const existing = db
    .select()
    .from(accountEntries)
    .where(
      and(
        eq(accountEntries.accountId, accountId),
        eq(accountEntries.date, date),
        eq(accountEntries.ticker, ticker)
      )
    )
    .get();

  if (existing) {
    db.update(accountEntries)
      .set({ amount, name, assetClass: assetClass ?? null, memo: memo ?? null, type })
      .where(eq(accountEntries.id, existing.id))
      .run();
    const updated = db.select().from(accountEntries).where(eq(accountEntries.id, existing.id)).get();
    return NextResponse.json(updated);
  }

  const id = generateId();
  db.insert(accountEntries)
    .values({ id, accountId, date, type, ticker, name, assetClass: assetClass ?? null, amount, memo: memo ?? null })
    .run();

  const row = db.select().from(accountEntries).where(eq(accountEntries.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}

// 계좌 기록 삭제
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entryId = req.nextUrl.searchParams.get("id");
  if (!entryId) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  // 소유권 확인
  const entry = db
    .select({ entry: accountEntries, portfolio: portfolios })
    .from(accountEntries)
    .innerJoin(accounts, eq(accountEntries.accountId, accounts.id))
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accountEntries.id, entryId), eq(portfolios.userId, session.userId)))
    .get();
  if (!entry) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });

  db.delete(accountEntries).where(eq(accountEntries.id, entryId)).run();
  return NextResponse.json({ ok: true });
}
