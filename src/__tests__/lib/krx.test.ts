import { describe, it, expect, vi, beforeEach } from "vitest";

describe("KRX ETF 데이터 수집", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchKrxEtfList가 ETF 목록을 반환한다", async () => {
    const mockResponse = {
      result: {
        etfItemList: [
          { itemcode: "069500", itemname: "KODEX 200", etfTabCode: 1 },
          { itemcode: "360750", itemname: "TIGER 미국S&P500", etfTabCode: 4 },
          { itemcode: "132030", itemname: "KODEX 골드선물", etfTabCode: 5 },
        ],
      },
    };

    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(mockResponse));

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encoded.buffer,
    } as Response);

    const { fetchKrxEtfList } = await import("@/lib/krx");
    const result = await fetchKrxEtfList();

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      ticker: "069500",
      name: "KODEX 200",
      market: "ETF",
      assetClass: "domestic_equity",
      category: "국내 시장지수",
    });
    expect(result[1].assetClass).toBe("foreign_equity");
    expect(result[2].assetClass).toBe("alternative");
  });

  it("API 에러 시 예외를 던진다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const { fetchKrxEtfList } = await import("@/lib/krx");
    await expect(fetchKrxEtfList()).rejects.toThrow("NAVER Finance API 응답 오류");
  });

  it("잘못된 응답 형식이면 예외를 던진다", async () => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify({ result: {} }));

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encoded.buffer,
    } as Response);

    const { fetchKrxEtfList } = await import("@/lib/krx");
    await expect(fetchKrxEtfList()).rejects.toThrow("응답 형식이 올바르지 않습니다");
  });

  it("레버리지/인버스(tabCode 3)는 assetClass가 null이다", async () => {
    const mockResponse = {
      result: {
        etfItemList: [
          { itemcode: "252670", itemname: "KODEX 200선물인버스2X", etfTabCode: 3 },
        ],
      },
    };

    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(mockResponse));

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encoded.buffer,
    } as Response);

    const { fetchKrxEtfList } = await import("@/lib/krx");
    const result = await fetchKrxEtfList();
    expect(result[0].assetClass).toBeNull();
    expect(result[0].category).toBe("레버리지/인버스");
  });
});
