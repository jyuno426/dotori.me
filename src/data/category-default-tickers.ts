/**
 * 자산군 → 기본 ETF 매핑
 *
 * 온보딩 자동 셋업 시 사용. v1은 카테고리당 *대표 1종목*만 매핑하고,
 * 사용자가 후속 화면에서 자유롭게 교체 가능.
 *
 * 선정 기준 (docs/specs/portfolio-presets.md §2):
 *   ① TER 낮음 ② 자산 규모 ③ 유동성 ④ 운용사 분산
 *
 * assetClass 값은 schema.securities.assetClass 와 일치 — 차후 마스터 데이터와 join.
 */

import type { AssetCategoryKey } from "./portfolio-presets";

export interface DefaultInstrument {
  ticker: string;
  name: string;
  assetClass: "domestic_equity" | "foreign_equity" | "bond" | "alternative";
}

export const CATEGORY_DEFAULT_TICKER: Record<AssetCategoryKey, DefaultInstrument> =
  {
    "kr-stock": {
      ticker: "069500",
      name: "KODEX 200",
      assetClass: "domestic_equity",
    },
    "us-stock": {
      ticker: "360750",
      name: "TIGER 미국S&P500",
      assetClass: "foreign_equity",
    },
    "dev-stock": {
      ticker: "195930",
      name: "TIGER 선진국MSCI(합성 H)",
      assetClass: "foreign_equity",
    },
    "em-stock": {
      ticker: "195980",
      name: "KODEX 신흥국MSCI(합성)",
      assetClass: "foreign_equity",
    },
    "kr-bond": {
      ticker: "152380",
      name: "KODEX 국고채10년",
      assetClass: "bond",
    },
    "us-bond": {
      ticker: "458250",
      name: "ACE 미국30년국채액티브(H)",
      assetClass: "bond",
    },
    gold: {
      ticker: "411060",
      name: "ACE KRX금현물",
      assetClass: "alternative",
    },
    alt: {
      ticker: "329200",
      name: "TIGER 리츠부동산인프라",
      assetClass: "alternative",
    },
  };
