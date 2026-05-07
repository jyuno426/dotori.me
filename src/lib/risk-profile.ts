/**
 * 위험 성향 진단 — 점수 산출 + 프리셋 매핑
 *
 * docs/specs/risk-profile.md §3·§4 기반.
 * 페르소나 B는 *전통적 10~15문항 진단*에 이탈하므로 2문항으로 압축.
 *
 * 차원:
 *   Q1 — 하락 감내도 (변동성에 대한 심리적 반응)
 *   Q2 — 투자 기간 (자금 인출 시점)
 *   Q3 — 우선순위 (선택, 동률 깸용)
 *
 * 합산 점수 → 5단계 매핑.
 */

import type { PresetKey } from "@/data/portfolio-presets";

export type AnswerScore = 1 | 2 | 3;

export interface QuizAnswers {
  q1?: AnswerScore;
  q2?: AnswerScore;
  q3?: AnswerScore;
}

export interface QuizQuestion {
  id: "q1" | "q2" | "q3";
  prompt: string;
  options: { score: AnswerScore; label: string }[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "투자한 돈이 1년 사이 30% 떨어졌어요. 어떻게 하실 것 같아요?",
    options: [
      {
        score: 1,
        label:
          "잠을 못 잘 것 같아요. 손실 줄이려고 일부 팔 것 같아요.",
      },
      { score: 2, label: "불안하지만 그냥 두고 보겠어요." },
      { score: 3, label: "오히려 더 사고 싶어요. 싸졌으니까요." },
    ],
  },
  {
    id: "q2",
    prompt: "이 돈을 언제 쓸 계획이에요?",
    options: [
      { score: 1, label: "5년 안에 (집·결혼·이사 등 큰 지출 예정)" },
      {
        score: 2,
        label: "10~20년 후 (중장기 — 자녀 교육, 노후 준비 일부)",
      },
      { score: 3, label: "20년 이상 (은퇴 후까지 안 써도 돼요)" },
    ],
  },
  {
    id: "q3",
    prompt: "다음 중 어느 쪽이 더 싫으세요?",
    options: [
      {
        score: 1,
        label: "수익이 평균보다 낮아도, 마음 편한 게 더 좋아요.",
      },
      {
        score: 3,
        label: "손실 위험이 있어도, 기회 놓치는 게 더 싫어요.",
      },
    ],
  },
];

export interface Recommendation {
  score: number;
  primary: PresetKey;
  secondary: PresetKey;
}

/**
 * 점수 합산 — Q1·Q2 기본, Q3은 동률 깸용으로 합산에 포함됨.
 * 답하지 않은 문항이 있으면 null.
 */
export function calculateScore(answers: QuizAnswers): number | null {
  if (answers.q1 == null || answers.q2 == null) return null;
  const base = answers.q1 + answers.q2;
  // Q3는 base가 3 또는 4(중간 경계)일 때만 효과를 가짐.
  // 그 외엔 base로 결정.
  if ((base === 3 || base === 4) && answers.q3 != null) {
    // Q3 보정: q3=1이면 한 단계 보수, q3=3이면 한 단계 적극
    if (answers.q3 === 1) return Math.max(2, base - 1);
    if (answers.q3 === 3) return Math.min(6, base + 1);
  }
  return base;
}

/**
 * Q3 노출 필요 여부 — Q1·Q2 합산이 3 또는 4(경계)일 때만 노출.
 */
export function needsTiebreaker(answers: QuizAnswers): boolean {
  if (answers.q1 == null || answers.q2 == null) return false;
  const base = answers.q1 + answers.q2;
  return base === 3 || base === 4;
}

/**
 * 점수 → 프리셋 매핑 (docs/specs/risk-profile.md §4.2)
 */
export function recommendByScore(score: number): Recommendation {
  if (score <= 2) {
    return { score, primary: "permanent", secondary: "k-allweather" };
  }
  if (score === 3) {
    return { score, primary: "k-allweather", secondary: "permanent" };
  }
  if (score === 4) {
    return { score, primary: "global-60-40", secondary: "k-allweather" };
  }
  if (score === 5) {
    return { score, primary: "global-60-40", secondary: "growth-30s" };
  }
  // score >= 6
  return { score, primary: "growth-30s", secondary: "global-60-40" };
}
