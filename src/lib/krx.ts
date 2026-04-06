/**
 * KRX ETF 데이터 수집 모듈
 *
 * NAVER Finance API를 통해 KRX 상장 전체 ETF 목록을 가져온다.
 */

export interface KrxEtf {
  ticker: string;
  name: string;
  market: "ETF";
  assetClass: string | null;
  category: string;
}

/**
 * NAVER etfTabCode → assetClass 매핑
 *
 * 1: 시장지수 (국내)  → domestic_equity
 * 2: 섹터/테마 (국내) → domestic_equity
 * 3: 레버리지/인버스  → null (기초자산 불명확)
 * 4: 해외             → foreign_equity
 * 5: 원자재/금        → alternative
 * 6: 채권/금리        → bond
 * 7: 혼합/머니마켓    → alternative
 */
const TAB_CODE_MAP: Record<number, { assetClass: string | null; category: string }> = {
  1: { assetClass: "domestic_equity", category: "국내 시장지수" },
  2: { assetClass: "domestic_equity", category: "국내 섹터/테마" },
  3: { assetClass: null, category: "레버리지/인버스" },
  4: { assetClass: "foreign_equity", category: "해외" },
  5: { assetClass: "alternative", category: "원자재" },
  6: { assetClass: "bond", category: "채권/금리" },
  7: { assetClass: "alternative", category: "혼합/머니마켓" },
};

/**
 * NAVER Finance API에서 전체 KRX ETF 목록 가져오기
 *
 * 약 1,000+ 개의 ETF를 반환한다.
 * 응답은 EUC-KR 인코딩이므로 디코딩 처리 필요.
 */
export async function fetchKrxEtfList(): Promise<KrxEtf[]> {
  const url = "https://finance.naver.com/api/sise/etfItemList.nhn?etfType=0";

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`NAVER Finance API 응답 오류: ${res.status} ${res.statusText}`);
  }

  // NAVER Finance는 EUC-KR 인코딩
  const buf = await res.arrayBuffer();
  const decoder = new TextDecoder("euc-kr");
  const text = decoder.decode(buf);
  const json = JSON.parse(text);

  const items = json.result?.etfItemList;
  if (!Array.isArray(items)) {
    throw new Error("NAVER Finance API 응답 형식이 올바르지 않습니다.");
  }

  return items.map((item: Record<string, unknown>) => {
    const tabCode = item.etfTabCode as number;
    const mapping = TAB_CODE_MAP[tabCode] || { assetClass: null, category: "기타" };

    return {
      ticker: item.itemcode as string,
      name: item.itemname as string,
      market: "ETF" as const,
      assetClass: mapping.assetClass,
      category: mapping.category,
    };
  });
}
