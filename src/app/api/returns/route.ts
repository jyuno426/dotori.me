import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios, accounts, accountSnapshots, prices } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

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

  // 2. 모든 스냅샷에서 입출금 합계
  let totalDeposit = 0;
  let totalWithdrawal = 0;
  for (const accId of accountIds) {
    const allSnapshots = db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, accId))
      .all();
    for (const snap of allSnapshots) {
      const flows: CashFlowEntry[] = snap.cashFlows ? JSON.parse(snap.cashFlows) : [];
      for (const f of flows) {
        const signed = f.flowType === "withdrawal" ? -f.amount : f.amount;
        if (signed > 0) totalDeposit += signed;
        else totalWithdrawal += signed;
      }
    }
  }
  const netInvested = totalDeposit + totalWithdrawal;

  // 3. 각 계좌별 최신 스냅샷에서 예수금
  let totalCash = 0;
  for (const accId of accountIds) {
    const latest = db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, accId))
      .orderBy(desc(accountSnapshots.date))
      .limit(1)
      .get();
    if (latest) totalCash += latest.cash;
  }

  // 4. 각 계좌별 최신 스냅샷에서 보유 종목 평가액
  const allLatestHoldings: HoldingEntry[] = [];
  for (const accId of accountIds) {
    const latest = db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, accId))
      .orderBy(desc(accountSnapshots.date))
      .limit(1)
      .get();
    if (latest) {
      const holdings: HoldingEntry[] = JSON.parse(latest.holdings);
      allLatestHoldings.push(...holdings);
    }
  }

  // 종목별 합산 (같은 ticker가 여러 계좌에 있을 수 있음)
  const tickerShares = new Map<string, { name: string; shares: number }>();
  for (const h of allLatestHoldings) {
    if (h.amount <= 0) continue;
    const existing = tickerShares.get(h.ticker);
    if (existing) {
      existing.shares += h.amount;
    } else {
      tickerShares.set(h.ticker, { name: h.name, shares: h.amount });
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

  for (const [ticker, { name, shares }] of tickerShares) {
    const latestPrice = db
      .select()
      .from(prices)
      .where(eq(prices.ticker, ticker))
      .orderBy(desc(prices.date))
      .limit(1)
      .get();

    const price = latestPrice?.close ?? null;
    const value = price != null ? shares * price : 0;
    holdingsValue += value;

    if (price == null) missingPricesSet.add(ticker);

    holdingDetails.push({ ticker, name, shares, price, value });
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
