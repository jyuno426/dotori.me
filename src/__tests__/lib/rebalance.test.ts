import { describe, it, expect } from "vitest";
import {
  analyzeDrift,
  calculateRebalanceOrders,
  calculateContributionAllocation,
} from "@/lib/rebalance";

const HOLDINGS = [
  { ticker: "A", name: "주식A", shares: 100, price: 10000, value: 1000000 },
  { ticker: "B", name: "채권B", shares: 50, price: 20000, value: 1000000 },
];

const TARGETS = [
  { ticker: "A", name: "주식A", targetPercent: 60 },
  { ticker: "B", name: "채권B", targetPercent: 40 },
];

describe("analyzeDrift", () => {
  it("현재 비중과 목표 비중의 차이를 계산한다", () => {
    const result = analyzeDrift(HOLDINGS, TARGETS, 0);

    expect(result).toHaveLength(2);
    expect(result[0].ticker).toBe("A");
    expect(result[0].currentPercent).toBe(50);
    expect(result[0].targetPercent).toBe(60);
    expect(result[0].drift).toBe(-10);
  });

  it("예수금을 포함하여 비중을 계산한다", () => {
    const result = analyzeDrift(HOLDINGS, TARGETS, 500000);
    const total = 2500000;

    expect(result[0].currentPercent).toBeCloseTo((1000000 / total) * 100, 1);
  });

  it("총 자산이 0이면 빈 배열을 반환한다", () => {
    const result = analyzeDrift([], TARGETS, 0);
    expect(result).toHaveLength(0);
  });
});

describe("calculateRebalanceOrders", () => {
  it("목표 비중에 맞는 매수/매도 주문을 생성한다", () => {
    const orders = calculateRebalanceOrders(HOLDINGS, TARGETS, 0);

    expect(orders.length).toBeGreaterThan(0);
    const orderA = orders.find((o) => o.ticker === "A");
    const orderB = orders.find((o) => o.ticker === "B");

    // A는 50% → 60% 필요: 매수
    expect(orderA?.action).toBe("buy");
    expect(orderA!.shares).toBeGreaterThan(0);

    // B는 50% → 40% 필요: 매도
    expect(orderB?.action).toBe("sell");
    expect(orderB!.shares).toBeGreaterThan(0);
  });

  it("이미 균형 잡힌 경우 hold를 반환한다", () => {
    const balanced = [
      { ticker: "A", name: "주식A", shares: 60, price: 10000, value: 600000 },
      { ticker: "B", name: "채권B", shares: 20, price: 20000, value: 400000 },
    ];
    const orders = calculateRebalanceOrders(balanced, TARGETS, 0);
    const actions = orders.map((o) => o.action);
    expect(actions.every((a) => a === "hold")).toBe(true);
  });

  it("총 자산이 0이면 빈 배열을 반환한다", () => {
    const orders = calculateRebalanceOrders([], TARGETS, 0);
    expect(orders).toHaveLength(0);
  });

  it("매도 주문이 매수보다 먼저 정렬된다", () => {
    const orders = calculateRebalanceOrders(HOLDINGS, TARGETS, 0);
    const nonHold = orders.filter((o) => o.action !== "hold");
    if (nonHold.length >= 2) {
      const sellIdx = nonHold.findIndex((o) => o.action === "sell");
      const buyIdx = nonHold.findIndex((o) => o.action === "buy");
      if (sellIdx >= 0 && buyIdx >= 0) {
        expect(sellIdx).toBeLessThan(buyIdx);
      }
    }
  });
});

describe("calculateContributionAllocation", () => {
  it("적립금을 부족 비중 자산에 우선 배분한다", () => {
    const orders = calculateContributionAllocation(HOLDINGS, TARGETS, 0, 200000);

    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.action === "buy")).toBe(true);

    // A가 부족하므로 A에 더 많이 배분
    const orderA = orders.find((o) => o.ticker === "A");
    expect(orderA).toBeDefined();
    expect(orderA!.shares).toBeGreaterThan(0);
  });

  it("적립금이 0이면 빈 배열을 반환한다", () => {
    const orders = calculateContributionAllocation(HOLDINGS, TARGETS, 0, 0);
    expect(orders).toHaveLength(0);
  });

  it("모든 주문은 매수이다", () => {
    const orders = calculateContributionAllocation(HOLDINGS, TARGETS, 0, 500000);
    expect(orders.every((o) => o.action === "buy")).toBe(true);
  });
});
