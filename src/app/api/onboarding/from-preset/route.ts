import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  portfolios,
  instruments,
  targetAllocations,
  accounts,
  prices,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { fetchPricesForTickers } from "@/lib/price-fetcher";
import {
  PORTFOLIO_PRESETS,
  type PresetKey,
  type AssetCategoryKey,
} from "@/data/portfolio-presets";
import { CATEGORY_DEFAULT_TICKER } from "@/data/category-default-tickers";

/**
 * 퀴즈에서 선택한 프리셋으로 *포트폴리오 + 종목 + 목표 비중 + 1차 계좌* 를
 * 원샷으로 만들어주는 온보딩 엔드포인트.
 *
 * 동일 사용자가 같은 프리셋으로 두 번 호출하면 새 포트폴리오를 또 만든다.
 * 중복 방지는 클라이언트 책임.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    presetKey?: PresetKey;
    portfolioName?: string;
    accountName?: string;
    accountType?: "irp" | "pension" | "isa" | "brokerage" | "cma";
  };

  const presetKey = body.presetKey;
  if (!presetKey || !(presetKey in PORTFOLIO_PRESETS)) {
    return NextResponse.json(
      { error: "유효한 프리셋을 선택해주세요." },
      { status: 400 },
    );
  }

  const preset = PORTFOLIO_PRESETS[presetKey];
  const portfolioName =
    body.portfolioName?.trim() || `내 ${preset.name} 포트폴리오`;
  const accountName = body.accountName?.trim() || "내 계좌";
  const accountType = body.accountType ?? "brokerage";

  const db = getDb();

  // 1. 포트폴리오 생성
  const portfolioId = generateId();
  await db
    .insert(portfolios)
    .values({
      id: portfolioId,
      userId: session.userId,
      name: portfolioName,
      description: `${preset.name} (${preset.source})`,
    })
    .run();

  // 2. 종목 + 목표 비중 — 비중 0인 자산군은 건너뜀
  const categories = Object.keys(preset.weights) as AssetCategoryKey[];
  for (const cat of categories) {
    const weight = preset.weights[cat];
    if (weight <= 0) continue;
    const inst = CATEGORY_DEFAULT_TICKER[cat];

    await db
      .insert(instruments)
      .values({
        id: generateId(),
        portfolioId,
        ticker: inst.ticker,
        name: inst.name,
        assetClass: inst.assetClass,
      })
      .run();

    await db
      .insert(targetAllocations)
      .values({
        id: generateId(),
        portfolioId,
        ticker: inst.ticker,
        name: inst.name,
        targetPercent: weight,
      })
      .run();
  }

  // 3. 1차 계좌 생성
  const accountId = generateId();
  await db
    .insert(accounts)
    .values({
      id: accountId,
      portfolioId,
      name: accountName,
      accountType,
    })
    .run();

  // 4. 시세 수집 — best-effort. 실패해도 온보딩은 성공.
  //    리밸런싱 contribute 모드가 첫 화면에서 매매 지시서를 보여주려면 필요.
  const tickers = Object.keys(preset.weights)
    .filter((k) => preset.weights[k as AssetCategoryKey] > 0)
    .map((k) => CATEGORY_DEFAULT_TICKER[k as AssetCategoryKey].ticker);
  let pricesSeeded = 0;
  try {
    const fetched = await fetchPricesForTickers(tickers);
    for (const p of fetched) {
      const existing = await db
        .select()
        .from(prices)
        .where(and(eq(prices.ticker, p.ticker), eq(prices.date, p.date)))
        .get();
      if (!existing) {
        await db
          .insert(prices)
          .values({
            id: generateId(),
            ticker: p.ticker,
            date: p.date,
            close: p.close,
          })
          .run();
        pricesSeeded += 1;
      }
    }
  } catch {
    /* NAVER API 장애 등 — 건너뜀. 사용자는 후속에 재시도 가능. */
  }

  return NextResponse.json(
    {
      portfolioId,
      accountId,
      presetKey,
      portfolioName,
      pricesSeeded,
    },
    { status: 201 },
  );
}
