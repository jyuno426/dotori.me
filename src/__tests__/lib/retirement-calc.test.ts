import { describe, it, expect } from "vitest";
import {
  calculateNeededAssets,
  calculateProjectedAssets,
  calculateAdditionalMonthlySavings,
  simulateRetirement,
} from "@/lib/retirement-calc";

describe("calculateNeededAssets", () => {
  it("월 생활비 250만원, 인출률 4%일 때 7.5억이 필요하다 (스펙 §4.2 예시)", () => {
    const result = calculateNeededAssets(250, 0.04);
    expect(result).toBe(75000); // 7.5억 = 75,000만원
  });

  it("월 생활비가 0이면 필요 자산도 0", () => {
    expect(calculateNeededAssets(0)).toBe(0);
  });

  it("인출률이 0이면 에러를 던진다", () => {
    expect(() => calculateNeededAssets(250, 0)).toThrow("인출률");
  });

  it("기본 인출률(4%)을 사용한다", () => {
    expect(calculateNeededAssets(300)).toBe(90000); // 300 × 12 / 0.04 = 9억
  });
});

describe("calculateProjectedAssets", () => {
  it("기간이 0이면 현재 자산을 그대로 반환한다", () => {
    expect(calculateProjectedAssets(3000, 50, 0)).toBe(3000);
  });

  it("수익률 0%일 때는 단순 합산", () => {
    // 현재 3000 + 월 50 × 12 × 10년 = 3000 + 6000 = 9000
    expect(calculateProjectedAssets(3000, 50, 10, 0)).toBe(9000);
  });

  it("수익률 4%로 35년 운용 시나리오 (페르소나 B 30→65세)", () => {
    // 현재 3000만원 + 월 50만원, r=4%, n=35년
    // 3000 × 1.04^35 + 50×12 × ((1.04^35 - 1) / 0.04)
    // 3000 × 3.9461 + 600 × 73.6522
    // ≈ 11838 + 44191 = 56029
    const result = calculateProjectedAssets(3000, 50, 35, 0.04);
    expect(result).toBeCloseTo(56029, -1);
  });

  it("현재 자산 0에서 시작해도 정상 계산", () => {
    // 0 + 50×12 × ((1.04^35 - 1) / 0.04) ≈ 44191
    const result = calculateProjectedAssets(0, 50, 35, 0.04);
    expect(result).toBeCloseTo(44191, -1);
  });

  it("월 저축 0만 있는 케이스 (현재 자산만 복리)", () => {
    const result = calculateProjectedAssets(10000, 0, 20, 0.04);
    // 10000 × 1.04^20 ≈ 21911
    expect(result).toBeCloseTo(21911, -1);
  });
});

describe("calculateAdditionalMonthlySavings", () => {
  it("부족분이 0이면 추가 저축도 0", () => {
    expect(calculateAdditionalMonthlySavings(0, 35)).toBe(0);
  });

  it("부족분이 음수면 0 반환 (잉여 케이스)", () => {
    expect(calculateAdditionalMonthlySavings(-5000, 35)).toBe(0);
  });

  it("기간이 0이면 Infinity (따라잡을 시간 없음)", () => {
    expect(calculateAdditionalMonthlySavings(10000, 0)).toBe(Infinity);
  });

  it("수익률 0%일 때 단순 분배", () => {
    // 부족 12000 / (12 × 10) = 100만원/월
    expect(calculateAdditionalMonthlySavings(12000, 10, 0)).toBe(100);
  });

  it("부족분 23000만원, 35년, 4%로 따라잡는 월 추가 저축액", () => {
    // 23000 / (12 × ((1.04^35 - 1) / 0.04))
    // 23000 / (12 × 73.6522) ≈ 23000 / 883.83 ≈ 26
    const result = calculateAdditionalMonthlySavings(23000, 35, 0.04);
    expect(result).toBeCloseTo(26.02, 0);
  });
});

describe("simulateRetirement", () => {
  const PERSONA_B_INPUT = {
    currentAge: 30,
    retirementAge: 65,
    currentAssets: 3000,
    monthlySavings: 50,
    monthlyExpenseInToday: 250,
  };

  it("페르소나 B 디폴트 입력 — 부족분 + 월 추가 저축 필요액 산출", () => {
    const result = simulateRetirement(PERSONA_B_INPUT);

    expect(result.yearsToRetirement).toBe(35);
    expect(result.neededAssets).toBe(75000); // 7.5억
    expect(result.projectedAssets).toBeGreaterThan(50000);
    expect(result.projectedAssets).toBeLessThan(60000);
    expect(result.gap).toBeGreaterThan(0); // 부족
    expect(result.surplus).toBe(0);
    expect(result.additionalMonthlySavings).toBeGreaterThan(0);
  });

  it("자산배분 도입 시나리오 — 수익률 +1%p로 따라잡는 금액", () => {
    const result = simulateRetirement(PERSONA_B_INPUT);

    expect(result.improvedScenario.projectedAssets).toBeGreaterThan(
      result.projectedAssets,
    );
    expect(result.improvedScenario.catchUpAmount).toBeGreaterThan(0);
  });

  it("잉여 케이스 — 이미 충분한 자산", () => {
    const result = simulateRetirement({
      ...PERSONA_B_INPUT,
      currentAssets: 100000, // 10억
      monthlySavings: 200,
    });

    expect(result.gap).toBe(0);
    expect(result.surplus).toBeGreaterThan(0);
    expect(result.additionalMonthlySavings).toBe(0);
  });

  it("현재 자산 0에서 시작 (사회초년생 케이스)", () => {
    const result = simulateRetirement({
      currentAge: 25,
      retirementAge: 65,
      currentAssets: 0,
      monthlySavings: 30,
      monthlyExpenseInToday: 200,
    });

    expect(result.yearsToRetirement).toBe(40);
    expect(result.projectedAssets).toBeGreaterThan(0);
  });

  it("은퇴 희망 연령이 현재 나이 이하면 에러", () => {
    expect(() =>
      simulateRetirement({
        ...PERSONA_B_INPUT,
        currentAge: 65,
        retirementAge: 65,
      }),
    ).toThrow("은퇴 희망 연령");

    expect(() =>
      simulateRetirement({
        ...PERSONA_B_INPUT,
        currentAge: 70,
        retirementAge: 65,
      }),
    ).toThrow("은퇴 희망 연령");
  });

  it("기본 가정값이 결과에 포함된다", () => {
    const result = simulateRetirement(PERSONA_B_INPUT);

    expect(result.assumptions.realReturnRate).toBe(0.04);
    expect(result.assumptions.withdrawalRate).toBe(0.04);
    expect(result.assumptions.withdrawalYears).toBe(25);
  });

  it("커스텀 가정값을 받을 수 있다", () => {
    const result = simulateRetirement({
      ...PERSONA_B_INPUT,
      realReturnRate: 0.05,
      withdrawalRate: 0.035,
      withdrawalYears: 30,
    });

    expect(result.assumptions.realReturnRate).toBe(0.05);
    expect(result.assumptions.withdrawalRate).toBe(0.035);
    expect(result.assumptions.withdrawalYears).toBe(30);
    // 인출률 3.5%면 필요 자산 = 250 × 12 / 0.035 ≈ 85714
    expect(result.neededAssets).toBeCloseTo(85714, -1);
  });

  it("월 생활비 0이면 잉여만 발생", () => {
    const result = simulateRetirement({
      ...PERSONA_B_INPUT,
      monthlyExpenseInToday: 0,
    });

    expect(result.neededAssets).toBe(0);
    expect(result.gap).toBe(0);
    expect(result.surplus).toBeGreaterThan(0);
  });
});
