import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  portfolios,
  accounts,
  holdings,
  cashFlows,
  cashBalances,
  prices,
} from "@/lib/db/schema";
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

  // 2. 입출금 합계 (포트폴리오 전체)
  let totalDeposit = 0;
  let totalWithdrawal = 0;
  for (const accId of accountIds) {
    const flows = db
      .select()
      .from(cashFlows)
      .where(eq(cashFlows.accountId, accId))
      .all();
    for (const f of flows) {
      if (f.amount > 0) totalDeposit += f.amount;
      else totalWithdrawal += f.amount;
    }
  }
  const netInvested = totalDeposit + totalWithdrawal; // 순 투자원금

  // 3. 예수금 합계
  let totalCash = 0;
  for (const accId of accountIds) {
    const latest = db
      .select()
      .from(cashBalances)
      .where(eq(cashBalances.accountId, accId))
      .orderBy(desc(cashBalances.date))
      .limit(1)
      .get();
    if (latest) totalCash += latest.balance;
  }

  // 4. 보유 종목 평가액
  const allHoldings = db
    .select({ holding: holdings, account: accounts })
    .from(holdings)
    .innerJoin(accounts, eq(holdings.accountId, accounts.id))
    .where(eq(accounts.portfolioId, portfolioId))
    .all();

  let holdingsValue = 0;
  const missingPricesSet = new Set<string>();
  const holdingDetails: {
    ticker: string;
    name: string;
    shares: number;
    price: number | null;
    value: number;
  }[] = [];

  for (const { holding } of allHoldings) {
    const latestPrice = db
      .select()
      .from(prices)
      .where(eq(prices.ticker, holding.ticker))
      .orderBy(desc(prices.date))
      .limit(1)
      .get();

    const price = latestPrice?.close ?? null;
    const value = price != null ? holding.shares * price : 0;
    holdingsValue += value;

    if (price == null) missingPricesSet.add(holding.ticker);

    holdingDetails.push({
      ticker: holding.ticker,
      name: holding.name,
      shares: holding.shares,
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
