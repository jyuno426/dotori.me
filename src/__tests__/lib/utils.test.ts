import { describe, it, expect } from "vitest";
import { generateId, formatKRW, formatPercent, cn } from "@/lib/utils";

describe("generateId", () => {
  it("12자 alphanumeric ID를 생성한다", () => {
    const id = generateId();
    expect(id).toHaveLength(12);
    expect(id).toMatch(/^[0-9a-z]+$/);
  });

  it("매번 고유한 ID를 생성한다", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("formatKRW", () => {
  it("양수를 원화 형식으로 포맷한다", () => {
    const result = formatKRW(1000000);
    expect(result).toContain("1,000,000");
    expect(result).toContain("₩");
  });

  it("0을 포맷한다", () => {
    const result = formatKRW(0);
    expect(result).toContain("0");
  });

  it("음수를 포맷한다", () => {
    const result = formatKRW(-500000);
    expect(result).toContain("500,000");
  });

  it("소수점을 제거한다", () => {
    const result = formatKRW(1234.56);
    expect(result).not.toContain(".");
  });
});

describe("formatPercent", () => {
  it("양수에 + 부호를 붙인다", () => {
    expect(formatPercent(5.5)).toBe("+5.5%");
  });

  it("음수에 - 부호를 붙인다", () => {
    expect(formatPercent(-3.2)).toBe("-3.2%");
  });

  it("0은 + 부호를 붙인다", () => {
    expect(formatPercent(0)).toBe("+0.0%");
  });

  it("소수점 자릿수를 지정할 수 있다", () => {
    expect(formatPercent(12.3456, 2)).toBe("+12.35%");
    expect(formatPercent(-0.1, 0)).toBe("-0%");
  });
});

describe("cn", () => {
  it("클래스명을 합친다", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("falsy 값을 필터링한다", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("빈 배열이면 빈 문자열을 반환한다", () => {
    expect(cn()).toBe("");
  });
});
