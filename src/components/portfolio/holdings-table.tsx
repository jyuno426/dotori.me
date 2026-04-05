"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface Holding {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
  shares: number;
  accountName?: string;
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
  alternative: "대안자산",
  cash: "현금",
};

interface Props {
  accountId?: string;
  portfolioId?: string;
  refreshKey?: number;
}

export function HoldingsTable({ accountId, portfolioId, refreshKey }: Props) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    const url = accountId
      ? `/api/holdings?accountId=${accountId}`
      : `/api/holdings?portfolioId=${portfolioId}`;
    fetch(url)
      .then((r) => r.json())
      .then(setHoldings)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, portfolioId, refreshKey]);

  async function handleDelete(id: string) {
    await fetch(`/api/holdings?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return <div className="animate-pulse text-foreground/40 text-sm py-4">로딩 중...</div>;
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/50 text-sm rounded-xl border border-dashed border-surface-dim">
        보유 종목이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-dim">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-dim bg-surface-dim/50">
            <th className="text-left px-4 py-3 font-medium text-foreground/60">종목</th>
            <th className="text-left px-4 py-3 font-medium text-foreground/60">코드</th>
            <th className="text-left px-4 py-3 font-medium text-foreground/60">자산군</th>
            <th className="text-right px-4 py-3 font-medium text-foreground/60">수량</th>
            {portfolioId && (
              <th className="text-left px-4 py-3 font-medium text-foreground/60">계좌</th>
            )}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id} className="border-b border-surface-dim last:border-0 hover:bg-surface-dim/30">
              <td className="px-4 py-3 font-medium">{h.name}</td>
              <td className="px-4 py-3 text-foreground/60 font-mono text-xs">{h.ticker}</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60">
                  {ASSET_CLASS_LABELS[h.assetClass] || h.assetClass}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">{h.shares}</td>
              {portfolioId && (
                <td className="px-4 py-3 text-foreground/60 text-xs">{h.accountName}</td>
              )}
              <td className="px-2 py-3">
                <button
                  onClick={() => handleDelete(h.id)}
                  className="p-1 text-foreground/30 hover:text-danger transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
