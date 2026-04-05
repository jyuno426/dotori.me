import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashFlows, accounts, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and, desc, gt, lt, sql } from "drizzle-orm";

// 입출금 내역 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");
  const portfolioId = req.nextUrl.searchParams.get("portfolioId");

  if (accountId) {
    // 소유권 확인
    const account = db
      .select({ account: accounts, portfolio: portfolios })
      .from(accounts)
      .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
      .where(and(eq(accounts.id, accountId), eq(portfolios.userId, session.userId)))
      .get();
    if (!account) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

    const rows = db
      .select()
      .from(cashFlows)
      .where(eq(cashFlows.accountId, accountId))
      .orderBy(desc(cashFlows.date))
      .all();

    const totalDeposit = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const totalWithdrawal = rows.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);

    return NextResponse.json({
      items: rows,
      summary: { totalDeposit, totalWithdrawal, net: totalDeposit + totalWithdrawal },
    });
  }

  if (portfolioId) {
    // 포트폴리오 소유권 확인
    const pf = db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
      .get();
    if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

    const rows = db
      .select({ cashFlow: cashFlows, account: accounts })
      .from(cashFlows)
      .innerJoin(accounts, eq(cashFlows.accountId, accounts.id))
      .where(eq(accounts.portfolioId, portfolioId))
      .orderBy(desc(cashFlows.date))
      .all();

    const items = rows.map((r) => ({ ...r.cashFlow, accountName: r.account.name }));
    const totalDeposit = items.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const totalWithdrawal = items.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);

    return NextResponse.json({
      items,
      summary: { totalDeposit, totalWithdrawal, net: totalDeposit + totalWithdrawal },
    });
  }

  return NextResponse.json({ error: "accountId 또는 portfolioId가 필요합니다." }, { status: 400 });
}

// 입출금 기록 추가
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, date, amount, memo } = await req.json();

  // 소유권 확인
  const account = db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accounts.id, accountId), eq(portfolios.userId, session.userId)))
    .get();
  if (!account) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  if (!date || amount == null || amount === 0) {
    return NextResponse.json({ error: "날짜와 금액을 입력해주세요." }, { status: 400 });
  }

  const id = generateId();
  db.insert(cashFlows)
    .values({ id, accountId, date, amount, memo: memo ?? null })
    .run();

  const row = db.select().from(cashFlows).where(eq(cashFlows.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}

// 입출금 기록 삭제
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flowId = req.nextUrl.searchParams.get("id");
  if (!flowId) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  // 소유권 확인: cashFlow → account → portfolio → userId
  const flow = db
    .select({ cashFlow: cashFlows, portfolio: portfolios })
    .from(cashFlows)
    .innerJoin(accounts, eq(cashFlows.accountId, accounts.id))
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(cashFlows.id, flowId), eq(portfolios.userId, session.userId)))
    .get();
  if (!flow) return NextResponse.json({ error: "입출금 기록을 찾을 수 없습니다." }, { status: 404 });

  db.delete(cashFlows).where(eq(cashFlows.id, flowId)).run();
  return NextResponse.json({ ok: true });
}
