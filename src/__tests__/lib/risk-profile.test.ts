import { describe, it, expect } from "vitest";
import {
  calculateScore,
  needsTiebreaker,
  recommendByScore,
  QUESTIONS,
} from "@/lib/risk-profile";

describe("calculateScore", () => {
  it("Q1·Q2 미답 시 null", () => {
    expect(calculateScore({})).toBeNull();
    expect(calculateScore({ q1: 2 })).toBeNull();
    expect(calculateScore({ q2: 2 })).toBeNull();
  });

  it("Q1·Q2 합산이 기본 점수", () => {
    expect(calculateScore({ q1: 1, q2: 1 })).toBe(2);
    expect(calculateScore({ q1: 2, q2: 3 })).toBe(5);
    expect(calculateScore({ q1: 3, q2: 3 })).toBe(6);
  });

  it("Q3는 base 2·5·6일 때 무시됨", () => {
    expect(calculateScore({ q1: 1, q2: 1, q3: 3 })).toBe(2);
    expect(calculateScore({ q1: 2, q2: 3, q3: 1 })).toBe(5);
    expect(calculateScore({ q1: 3, q2: 3, q3: 1 })).toBe(6);
  });

  it("Q3는 base 3·4 경계일 때 한 단계 보정", () => {
    // base 3 + q3=1(보수) → 2
    expect(calculateScore({ q1: 1, q2: 2, q3: 1 })).toBe(2);
    // base 3 + q3=3(적극) → 4
    expect(calculateScore({ q1: 1, q2: 2, q3: 3 })).toBe(4);
    // base 4 + q3=1(보수) → 3
    expect(calculateScore({ q1: 2, q2: 2, q3: 1 })).toBe(3);
    // base 4 + q3=3(적극) → 5
    expect(calculateScore({ q1: 2, q2: 2, q3: 3 })).toBe(5);
  });

  it("점수는 [2, 6] 범위로 제한", () => {
    // 보정으로도 2 미만으로 못 떨어짐
    expect(calculateScore({ q1: 1, q2: 2, q3: 1 })).toBeGreaterThanOrEqual(2);
    // 6 초과로도 못 올라감
    expect(calculateScore({ q1: 2, q2: 2, q3: 3 })).toBeLessThanOrEqual(6);
  });
});

describe("needsTiebreaker", () => {
  it("base 3·4 경계일 때만 true", () => {
    expect(needsTiebreaker({ q1: 1, q2: 2 })).toBe(true);
    expect(needsTiebreaker({ q1: 2, q2: 2 })).toBe(true);
    expect(needsTiebreaker({ q1: 2, q2: 1 })).toBe(true);
  });

  it("그 외는 false", () => {
    expect(needsTiebreaker({ q1: 1, q2: 1 })).toBe(false); // 2
    expect(needsTiebreaker({ q1: 2, q2: 3 })).toBe(false); // 5
    expect(needsTiebreaker({ q1: 3, q2: 3 })).toBe(false); // 6
  });

  it("Q1·Q2 미답 시 false", () => {
    expect(needsTiebreaker({})).toBe(false);
    expect(needsTiebreaker({ q1: 2 })).toBe(false);
  });
});

describe("recommendByScore", () => {
  it("점수 2 — 영구포트폴리오 우선", () => {
    const r = recommendByScore(2);
    expect(r.primary).toBe("permanent");
    expect(r.secondary).toBe("k-allweather");
  });

  it("점수 3 — K-올웨더 우선", () => {
    const r = recommendByScore(3);
    expect(r.primary).toBe("k-allweather");
    expect(r.secondary).toBe("permanent");
  });

  it("점수 4 — 글로벌 60/40 우선", () => {
    const r = recommendByScore(4);
    expect(r.primary).toBe("global-60-40");
    expect(r.secondary).toBe("k-allweather");
  });

  it("점수 5 — 글로벌 60/40 우선, 30대 성장형 보조", () => {
    const r = recommendByScore(5);
    expect(r.primary).toBe("global-60-40");
    expect(r.secondary).toBe("growth-30s");
  });

  it("점수 6 — 30대 성장형 우선", () => {
    const r = recommendByScore(6);
    expect(r.primary).toBe("growth-30s");
    expect(r.secondary).toBe("global-60-40");
  });

  it("범위 밖 점수도 안전하게 매핑", () => {
    expect(recommendByScore(1).primary).toBe("permanent");
    expect(recommendByScore(7).primary).toBe("growth-30s");
    expect(recommendByScore(0).primary).toBe("permanent");
  });
});

describe("QUESTIONS 데이터", () => {
  it("Q1·Q2는 옵션 3개, Q3는 옵션 2개", () => {
    expect(QUESTIONS).toHaveLength(3);
    const [q1, q2, q3] = QUESTIONS;
    expect(q1.options).toHaveLength(3);
    expect(q2.options).toHaveLength(3);
    expect(q3.options).toHaveLength(2);
  });

  it("모든 옵션 점수는 1·2·3 중 하나", () => {
    QUESTIONS.forEach((q) => {
      q.options.forEach((opt) => {
        expect([1, 2, 3]).toContain(opt.score);
      });
    });
  });

  it("Q3 옵션 점수는 1과 3만 (중간 없음)", () => {
    const q3 = QUESTIONS[2];
    const scores = q3.options.map((o) => o.score).sort();
    expect(scores).toEqual([1, 3]);
  });
});
