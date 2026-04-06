import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, accounts, accountEntries, prices } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// 포트폴리오 수익률 계산
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolioId = req.nextUrl.searchParams.get("portfolioId");
  if (!portfolioId) {
    return NextResponse.json({ error: "portfolioId가 필요합니다." }, { status: 400 });
  }

  const pf = db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
    .get();
  if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

  // 1. 전체 계좌 조회
  const accs = db
    .select()
    .from(accounts)
    .where(eq(accounts.portfolioId, portfolioId))
    .all();

  const accountIds = accs.map((a) => a.id);

  // 2. 입출금 합계 (cash_flow 타입)
  let totalDeposit = 0;
  let totalWithdrawal = 0;
  for (const accId of accountIds) {
    const flows = db
      .select()
      .from(accountEntries)
      .where(and(eq(accountEntries.accountId, accId), eq(accountEntries.type, "cash_flow")))
      .all();
    for (const f of flows) {
      if (f.amount > 0) totalDeposit += f.amount;
      else totalWithdrawal += f.amount;
    }
  }
  const netInvested = totalDeposit + totalWithdrawal;

  // 3. 예수금 합계 (cash 타입, 각 계좌별 최신)
  let totalCash = 0;
  for (const accId of accountIds) {
    const latest = db
      .select()
      .from(accountEntries)
      .where(and(eq(accountEntries.accountId, accId), eq(accountEntries.type, "cash")))
      .orderBy(desc(accountEntries.date))
      .limit(1)
      .get();
    if (latest) totalCash += latest.amount;
  }

  // 4. 보유 종목 평가액 (holding 타입, 각 계좌+종목별 최신)
  const allHoldingEntries = db
    .select({ entry: accountEntries, account: accounts })
    .from(accountEntries)
    .innerJoin(accounts, eq(accountEntries.accountId, accounts.id))
    .where(and(eq(accounts.portfolioId, portfolioId), eq(accountEntries.type, "holding")))
    .orderBy(desc(accountEntries.date))
    .all();

  // 계좌+종목 조합별 최신 레코드만 추출
  const latestHoldings = new Map<string, typeof allHoldingEntries[0]>();
  for (const row of allHoldingEntries) {
    const key = `${row.entry.accountId}:${row.entry.ticker}`;
    if (!latestHoldings.has(key)) {
      latestHoldings.set(key, row);
    }
  }

  let holdingsValue = 0;
  const missingPricesSet = new Set<string>();
  const holdingDetails: {
    ticker: string;
    name: string;
    shares: number;
    price: number | null;
    value: number;
  }[] = [];

  for (const [, { entry }] of latestHoldings) {
    const latestPrice = db
      .select()
      .from(prices)
      .where(eq(prices.ticker, entry.ticker))
      .orderBy(desc(prices.date))
      .limit(1)
      .get();

    const price = latestPrice?.close ?? null;
    const value = price != null ? entry.amount * price : 0;
    holdingsValue += value;

    if (price == null) missingPricesSet.add(entry.ticker);

    holdingDetails.push({
      ticker: entry.ticker,
      name: entry.name,
      shares: entry.amount,
      price,
      value,
    });
  }

  // 5. 총 평가액
  const totalValue = holdingsValue + totalCash;

  // 6. 수익률 계산
  const profitLoss = totalValue - netInvested;
  const returnRate = netInvested > 0 ? (profitLoss / netInvested) * 100 : 0;

  return NextResponse.json({
    totalValue,
    holdingsValue,
    totalCash,
    totalDeposit,
    totalWithdrawal,
    netInvested,
    profitLoss,
    returnRate: Math.round(returnRate * 100) / 100,
    missingPrices: [...missingPricesSet],
    holdingDetails,
  });
}
