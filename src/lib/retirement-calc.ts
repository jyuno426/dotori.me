/**
 * 은퇴 계산기 코어 로직
 *
 * v8 §4 사용자 여정 1단계 "wake-up"의 핵심 계산.
 * 페르소나 B 기준 — 실질 수익률 4% / 인출률 4% / 인출 25년 디폴트.
 *
 * 입력·출력 단위: 만원 (10,000 KRW).
 *
 * 스펙: docs/specs/retirement-calculator.md §4
 */

export interface RetirementInput {
  /** 현재 나이 (세) */
  currentAge: number;
  /** 은퇴 희망 연령 (세) */
  retirementAge: number;
  /** 현재 총 자산 (만원) */
  currentAssets: number;
  /** 월 저축 가능액 (만원) */
  monthlySavings: number;
  /** 은퇴 후 월 생활비 — 현재 가치 기준 (만원) */
  monthlyExpenseInToday: number;

  /** 실질 수익률 (연, 기본 0.04) — 인플레이션 차감 후 */
  realReturnRate?: number;
  /** 인출률 (기본 0.04) — Trinity 룰 보수 변형 */
  withdrawalRate?: number;
  /** 인출 기간 (년, 기본 25) — 메타데이터. 필요 자산 계산에는 인출률만 사용 */
  withdrawalYears?: number;
  /** 자산배분 도입 시 개선된 수익률 (연, 기본 0.05) */
  improvedRealReturnRate?: number;
}

export interface RetirementResult {
  /** 은퇴 시점 필요 자산 (만원, 실질 가치) */
  neededAssets: number;
  /** 현재 페이스로 도달 자산 (만원, 실질 가치) */
  projectedAssets: number;
  /** 부족분 (만원, 양수면 부족) */
  gap: number;
  /** 잉여분 (만원, 양수면 잉여) */
  surplus: number;
  /** 부족을 따라잡기 위한 월 추가 저축 필요액 (만원). 부족 없으면 0 */
  additionalMonthlySavings: number;
  /** 자산배분 도입 시나리오 (수익률 개선) */
  improvedScenario: {
    projectedAssets: number;
    catchUpAmount: number;
  };
  /** 은퇴까지 남은 년수 */
  yearsToRetirement: number;
  /** 사용된 가정값 */
  assumptions: {
    realReturnRate: number;
    withdrawalRate: number;
    withdrawalYears: number;
  };
}

const DEFAULT_REAL_RETURN_RATE = 0.04;
const DEFAULT_WITHDRAWAL_RATE = 0.04;
const DEFAULT_WITHDRAWAL_YEARS = 25;
const DEFAULT_IMPROVED_REAL_RETURN_RATE = 0.05;

/**
 * 은퇴 시점 필요 자산 (실질 가치)
 *
 *   필요 자산 = (월 생활비 × 12) ÷ 인출률
 *
 * @example
 *   calculateNeededAssets(250)  // → 75000 (250만원 × 12 / 0.04 = 7.5억)
 */
export function calculateNeededAssets(
  monthlyExpenseInToday: number,
  withdrawalRate: number = DEFAULT_WITHDRAWAL_RATE,
): number {
  if (monthlyExpenseInToday <= 0) return 0;
  if (withdrawalRate <= 0) {
    throw new Error("인출률은 0보다 커야 합니다.");
  }
  return (monthlyExpenseInToday * 12) / withdrawalRate;
}

/**
 * 현재 페이스로 도달하는 자산 (실질 가치)
 *
 *   도달 = 현재자산 × (1+r)^n + 월저축 × 12 × [((1+r)^n − 1) ÷ r]
 *
 * r = 0인 경우:
 *   도달 = 현재자산 + 월저축 × 12 × n
 *
 * @param currentAssets 현재 총 자산 (만원)
 * @param monthlySavings 월 저축액 (만원)
 * @param years 운용 기간 (년)
 * @param realReturnRate 실질 수익률 (연)
 */
export function calculateProjectedAssets(
  currentAssets: number,
  monthlySavings: number,
  years: number,
  realReturnRate: number = DEFAULT_REAL_RETURN_RATE,
): number {
  if (years <= 0) return currentAssets;

  if (realReturnRate === 0) {
    return currentAssets + monthlySavings * 12 * years;
  }

  const r = realReturnRate;
  const growthFactor = Math.pow(1 + r, years);
  const annuityFactor = (growthFactor - 1) / r;

  return currentAssets * growthFactor + monthlySavings * 12 * annuityFactor;
}

/**
 * 부족분을 메우기 위한 월 추가 저축 필요액
 *
 *   X = 부족분 ÷ (12 × [((1+r)^n − 1) ÷ r])
 *
 * r = 0인 경우:
 *   X = 부족분 ÷ (12 × n)
 *
 * @param gap 부족분 (만원, 양수)
 * @param years 따라잡을 기간 (년)
 * @param realReturnRate 실질 수익률 (연)
 */
export function calculateAdditionalMonthlySavings(
  gap: number,
  years: number,
  realReturnRate: number = DEFAULT_REAL_RETURN_RATE,
): number {
  if (gap <= 0) return 0;
  if (years <= 0) return Infinity;

  if (realReturnRate === 0) {
    return gap / (12 * years);
  }

  const r = realReturnRate;
  const growthFactor = Math.pow(1 + r, years);
  const annuityFactor = (growthFactor - 1) / r;

  return gap / (12 * annuityFactor);
}

/**
 * 통합 은퇴 시뮬레이션
 *
 * v8 §4 wake-up 단계의 결과 객체 산출.
 * 모든 금액은 *만원* 단위로 반올림되어 반환된다.
 */
export function simulateRetirement(input: RetirementInput): RetirementResult {
  const realReturnRate = input.realReturnRate ?? DEFAULT_REAL_RETURN_RATE;
  const withdrawalRate = input.withdrawalRate ?? DEFAULT_WITHDRAWAL_RATE;
  const withdrawalYears = input.withdrawalYears ?? DEFAULT_WITHDRAWAL_YEARS;
  const improvedRate =
    input.improvedRealReturnRate ?? DEFAULT_IMPROVED_REAL_RETURN_RATE;

  const yearsToRetirement = input.retirementAge - input.currentAge;

  if (yearsToRetirement <= 0) {
    throw new Error("은퇴 희망 연령은 현재 나이보다 커야 합니다.");
  }

  const neededAssets = calculateNeededAssets(
    input.monthlyExpenseInToday,
    withdrawalRate,
  );

  const projectedAssets = calculateProjectedAssets(
    input.currentAssets,
    input.monthlySavings,
    yearsToRetirement,
    realReturnRate,
  );

  const diff = neededAssets - projectedAssets;
  const gap = Math.max(0, diff);
  const surplus = Math.max(0, -diff);

  const additionalMonthlySavings = calculateAdditionalMonthlySavings(
    gap,
    yearsToRetirement,
    realReturnRate,
  );

  const improvedProjected = calculateProjectedAssets(
    input.currentAssets,
    input.monthlySavings,
    yearsToRetirement,
    improvedRate,
  );
  const catchUpAmount = improvedProjected - projectedAssets;

  return {
    neededAssets: roundToManwon(neededAssets),
    projectedAssets: roundToManwon(projectedAssets),
    gap: roundToManwon(gap),
    surplus: roundToManwon(surplus),
    additionalMonthlySavings: roundToManwon(additionalMonthlySavings),
    improvedScenario: {
      projectedAssets: roundToManwon(improvedProjected),
      catchUpAmount: roundToManwon(catchUpAmount),
    },
    yearsToRetirement,
    assumptions: {
      realReturnRate,
      withdrawalRate,
      withdrawalYears,
    },
  };
}

function roundToManwon(value: number): number {
  if (!isFinite(value)) return value;
  return Math.round(value);
}
