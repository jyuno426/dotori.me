"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface HoldingWithPrice {
  ticker: string;
  name: string;
  shares: number;
  price: number | null;
  value: number;
}

export function PriceInputForm({
  portfolioId,
  holdings,
  onSaved,
}: {
  portfolioId: string;
  holdings: HoldingWithPrice[];
  onSaved?: () => void;
}) {
  const [priceValues, setPriceValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // 기존 가격으로 초기화
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const h of holdings) {
      if (h.price != null) initial[h.ticker] = String(h.price);
    }
    setPriceValues(initial);
  }, [holdings]);

  // 중복 ticker 제거
  const uniqueHoldings = holdings.reduce((acc, h) => {
    if (!acc.find((a) => a.ticker === h.ticker)) acc.push(h);
    return acc;
  }, [] as HoldingWithPrice[]);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    const today = new Date().toISOString().split("T")[0];

    const items = Object.entries(priceValues)
      .filter(([, v]) => v && Number(v) > 0)
      .map(([ticker, close]) => ({
        ticker,
        date: today,
        close: Number(close),
      }));

    if (items.length === 0) {
      setSaving(false);
      return;
    }

    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (res.ok) {
      setSuccess(true);
      onSaved?.();
      setTimeout(() => setSuccess(false), 2000);
    }
    setSaving(false);
  }

  if (uniqueHoldings.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-3">
      <h2 className="text-sm font-semibold text-foreground/70 flex items-center gap-1.5">
        <DollarSign size={14} />
        종목별 현재가 입력
      </h2>

      <div className="space-y-2">
        {uniqueHoldings.map((h) => (
          <div key={h.ticker} className="flex items-center gap-3">
            <div className="w-32 shrink-0">
              <p className="text-sm font-medium truncate">{h.name}</p>
              <p className="text-xs text-foreground/60">{h.ticker}</p>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={priceValues[h.ticker] ?? ""}
              onChange={(e) =>
                setPriceValues((v) => ({ ...v, [h.ticker]: e.target.value }))
              }
              placeholder="현재가"
              className="w-32 rounded-lg border border-surface-dim px-3 py-1.5 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-xs text-foreground/60">원</span>
            {priceValues[h.ticker] && Number(priceValues[h.ticker]) > 0 && (
              <span className="text-xs text-foreground/60">
                = {formatKRW(h.shares * Number(priceValues[h.ticker]))}
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {saving ? "저장 중..." : success ? "저장됨" : "현재가 저장"}
      </button>
    </div>
  );
}
