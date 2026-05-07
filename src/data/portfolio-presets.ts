/**
 * 포트폴리오 프리셋 마스터 데이터
 *
 * 4개 정적 자산배분. v8 §8 + docs/specs/portfolio-presets.md 기반.
 * 비중까지만 제공, 종목은 사용자가 카테고리별 후보 중 선택 (자본시장법 §4.3 경계).
 */

export type AssetCategoryKey =
  | "kr-stock"
  | "us-stock"
  | "dev-stock"
  | "em-stock"
  | "kr-bond"
  | "us-bond"
  | "gold"
  | "alt";

export const ASSET_CATEGORIES: Record<
  AssetCategoryKey,
  { name: string; short: string }
> = {
  "kr-stock": { name: "한국 주식", short: "한국" },
  "us-stock": { name: "미국 주식", short: "미국" },
  "dev-stock": { name: "선진국 주식 (미국 제외)", short: "선진국" },
  "em-stock": { name: "신흥국 주식", short: "신흥국" },
  "kr-bond": { name: "한국 채권 (장기)", short: "한채" },
  "us-bond": { name: "미국 채권 (장기)", short: "미채" },
  gold: { name: "금", short: "금" },
  alt: { name: "리츠 / 대안자산", short: "대안" },
};

export type PresetKey =
  | "permanent"
  | "k-allweather"
  | "global-60-40"
  | "growth-30s";

export interface PortfolioPreset {
  key: PresetKey;
  name: string;
  weights: Record<AssetCategoryKey, number>; // 합 100
  source: string;
  matchCopy: string; // "균형이 가장 잘 맞는 분께" 등
  blurb: string; // 결과 카드 본문 (2~3문장)
}

export const PORTFOLIO_PRESETS: Record<PresetKey, PortfolioPreset> = {
  permanent: {
    key: "permanent",
    name: "영구포트폴리오",
    weights: {
      "kr-stock": 0,
      "us-stock": 12.5,
      "dev-stock": 6.25,
      "em-stock": 6.25,
      "kr-bond": 12.5,
      "us-bond": 12.5,
      gold: 25,
      alt: 25,
    },
    source: "해리 브라운 (1981)",
    matchCopy: "마음 편한 게 가장 중요한 분께",
    blurb:
      "주식·채권·금·현금성을 4등분으로 나눠 가장 변동성을 줄이는 방식이에요. 큰 흔들림 없이 묵묵히 가는 분께 잘 맞아요.",
  },
  "k-allweather": {
    key: "k-allweather",
    name: "K-올웨더형",
    weights: {
      "kr-stock": 10,
      "us-stock": 12,
      "dev-stock": 5,
      "em-stock": 3,
      "kr-bond": 25,
      "us-bond": 25,
      gold: 12,
      alt: 8,
    },
    source: "김성일 「마법의 돈굴리기」 참조",
    matchCopy: "안정 우선이지만 약간의 성장도 원하는 분께",
    blurb:
      "한국 투자자 시각의 올웨더 변형이에요. 채권 비중 50%로 안정성을 챙기면서, 주식·금으로 살짝의 성장도 더해요.",
  },
  "global-60-40": {
    key: "global-60-40",
    name: "글로벌 60/40",
    weights: {
      "kr-stock": 10,
      "us-stock": 30,
      "dev-stock": 15,
      "em-stock": 5,
      "kr-bond": 20,
      "us-bond": 20,
      gold: 0,
      alt: 0,
    },
    source: "전통적 자산배분 (Vanguard·Bogle 등)",
    matchCopy: "균형이 가장 잘 맞는 분께",
    blurb:
      "전 세계 주식과 채권을 6:4로 섞는 가장 검증된 자산배분이에요. 변동성과 수익의 균형이 좋아요.",
  },
  "growth-30s": {
    key: "growth-30s",
    name: "30대 성장형",
    weights: {
      "kr-stock": 10,
      "us-stock": 40,
      "dev-stock": 18,
      "em-stock": 7,
      "kr-bond": 10,
      "us-bond": 10,
      gold: 3,
      alt: 2,
    },
    source: "30대 평균 비중 권장형",
    matchCopy: "긴 시간을 무기로 삼는 분께",
    blurb:
      "주식 75% 중심으로 *시간*이라는 무기를 가장 잘 활용하는 비중이에요. 단기 변동은 받아들이고, 20년 이상의 호흡으로 가요.",
  },
};

export const PRESET_ORDER: PresetKey[] = [
  "permanent",
  "k-allweather",
  "global-60-40",
  "growth-30s",
];
