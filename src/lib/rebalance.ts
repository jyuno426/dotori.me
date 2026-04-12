/**
 * 리밸런싱 계산 엔진
 *
 * 목표 비중 대비 현재 비중의 드리프트를 계산하고,
 * ETF 1주 단위로 매수/매도 수량을 산출한다.
 */

export interface HoldingPosition {
  ticker: string;
  name: string;
  shares: number;
  price: number; // 현재가
  value: number; // shares × price
}

export interface TargetWeight {
  ticker: string;
  name: string;
  targetPercent: number; // 0~100
}

export interface DriftItem {
  ticker: string;
  name: string;
  targetPercent: number;
  currentPercent: number;
  drift: number; // current - target
  currentValue: number;
  targetValue: number;
}

export interface TradeOrder {
  ticker: string;
  name: string;
  action: "buy" | "sell" | "hold";
  shares: number; // 매수/매도 수량 (항상 양수)
  price: number;
  amount: number; // shares × price
  currentShares: number;
  afterShares: number;
}

/**
 * 드리프트 분석
 */
export function analyzeDrift(
  holdings: HoldingPosition[],
  targets: TargetWeight[],
  cashBalance: number,
): DriftItem[] {
  const totalValue = holdings.reduce((s, h) => s + h.value, 0) + cashBalance;
  if (totalValue <= 0) return [];

  return targets.map((t) => {
    const holding = holdings.find((h) => h.ticker === t.ticker);
    const currentValue = holding?.value ?? 0;
    const currentPercent = (currentValue / totalValue) * 100;
    const targetValue = (t.targetPercent / 100) * totalValue;

    return {
      ticker: t.ticker,
      name: t.name,
      targetPercent: t.targetPercent,
      currentPercent: Math.round(currentPercent * 100) / 100,
      drift: Math.round((currentPercent - t.targetPercent) * 100) / 100,
      currentValue,
      targetValue: Math.round(targetValue),
    };
  });
}

/**
 * 리밸런싱 매매 지시서 계산
 *
 * 목표 비중에 맞추기 위해 필요한 ETF 매수/매도 수량을 1주 단위로 계산한다.
 */
export function calculateRebalanceOrders(
  holdings: HoldingPosition[],
  targets: TargetWeight[],
  cashBalance: number,
): TradeOrder[] {
  const totalValue = holdings.reduce((s, h) => s + h.value, 0) + cashBalance;
  if (totalValue <= 0) return [];

  return targets
    .map((t) => {
      const holding = holdings.find((h) => h.ticker === t.ticker);
      const currentShares = holding?.shares ?? 0;
      const price = holding?.price ?? 0;

      if (price <= 0) {
        return {
          ticker: t.ticker,
          name: t.name,
          action: "hold" as const,
          shares: 0,
          price: 0,
          amount: 0,
          currentShares,
          afterShares: currentShares,
        };
      }

      const targetValue = (t.targetPercent / 100) * totalValue;
      const targetShares = Math.round(targetValue / price);
      const diff = targetShares - currentShares;

      if (diff === 0) {
        return {
          ticker: t.ticker,
          name: t.name,
          action: "hold" as const,
          shares: 0,
          price,
          amount: 0,
          currentShares,
          afterShares: currentShares,
        };
      }

      return {
        ticker: t.ticker,
        name: t.name,
        action: diff > 0 ? ("buy" as const) : ("sell" as const),
        shares: Math.abs(diff),
        price,
        amount: Math.abs(diff) * price,
        currentShares,
        afterShares: targetShares,
      };
    })
    .sort((a, b) => {
      // 매도 먼저, 그 다음 매수, 마지막 hold
      const order = { sell: 0, buy: 1, hold: 2 };
      return order[a.action] - order[b.action];
    });
}

/**
 * 월 적립금 배분 계산
 *
 * 추가 적립금으로 부족 비중 자산을 우선 매수한다.
 */
export function calculateContributionAllocation(
  holdings: HoldingPosition[],
  targets: TargetWeight[],
  cashBalance: number,
  contributionAmount: number,
): TradeOrder[] {
  const currentTotal = holdings.reduce((s, h) => s + h.value, 0) + cashBalance;
  const newTotal = currentTotal + contributionAmount;

  if (newTotal <= 0 || contributionAmount <= 0) return [];

  // 새 총액 기준으로 목표 비중 계산
  const orders: TradeOrder[] = [];
  let remaining = contributionAmount;

  // 부족 비중 큰 순으로 정렬
  const deficits = targets
    .map((t) => {
      const holding = holdings.find((h) => h.ticker === t.ticker);
      const currentValue = holding?.value ?? 0;
      const price = holding?.price ?? 0;
      const targetValue = (t.targetPercent / 100) * newTotal;
      const deficit = targetValue - currentValue;
      return { ...t, currentValue, price, deficit, currentShares: holding?.shares ?? 0 };
    })
    .filter((d) => d.deficit > 0 && d.price > 0)
    .sort((a, b) => b.deficit - a.deficit);

  for (const d of deficits) {
    if (remaining <= 0) break;

    const buyAmount = Math.min(d.deficit, remaining);
    const buyShares = Math.floor(buyAmount / d.price);

    if (buyShares > 0) {
      const actualAmount = buyShares * d.price;
      remaining -= actualAmount;

      orders.push({
        ticker: d.ticker,
        name: d.name,
        action: "buy",
        shares: buyShares,
        price: d.price,
        amount: actualAmount,
        currentShares: d.currentShares,
        afterShares: d.currentShares + buyShares,
      });
    }
  }

  return orders;
}
