/**
 * ETF 시세 수집 모듈
 *
 * NAVER Finance API를 통해 ETF 현재가(종가)를 조회한다.
 */

export interface PriceResult {
  ticker: string;
  close: number;
  date: string; // YYYY-MM-DD
}

/**
 * NAVER Finance에서 ETF 현재가를 가져온다.
 * 전체 ETF 목록의 현재가를 한 번에 반환.
 */
export async function fetchEtfPrices(): Promise<PriceResult[]> {
  const url = "https://finance.naver.com/api/sise/etfItemList.nhn?etfType=0";

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`NAVER Finance API 응답 오류: ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  const decoder = new TextDecoder("euc-kr");
  const text = decoder.decode(buf);
  const json = JSON.parse(text);

  const items = json.result?.etfItemList;
  if (!Array.isArray(items)) {
    throw new Error("NAVER Finance API 응답 형식 오류");
  }

  // 오늘 날짜 (한국 시간 기준)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const today = kstDate.toISOString().split("T")[0];

  return items.map((item: Record<string, unknown>) => ({
    ticker: item.itemcode as string,
    close: Number(item.nowVal) || 0,
    date: today,
  })).filter((p: PriceResult) => p.close > 0);
}

/**
 * 특정 종목들의 현재가만 필터링하여 반환
 */
export async function fetchPricesForTickers(tickers: string[]): Promise<PriceResult[]> {
  const all = await fetchEtfPrices();
  const tickerSet = new Set(tickers);
  return all.filter((p) => tickerSet.has(p.ticker));
}
