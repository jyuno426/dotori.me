"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface Holding {
  id: string;
  ticker: string;
  name: string;
  assetClass: string | null;
  amount: number; // shares
  date: string;
  accountName?: string;
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
  alternative: "대안자산",
};

interface Props {
  accountId?: string;
  portfolioId?: string;
  refreshKey?: number;
}

export function HoldingsTable({ accountId, portfolioId, refreshKey }: Props) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setError("");
    const url = accountId
      ? `/api/account-entries?accountId=${accountId}&type=holding`
      : `/api/account-entries?portfolioId=${portfolioId}&type=holding`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        // 포트폴리오 조회 시 계좌+종목별 최신 레코드만 표시
        const latest = dedupeLatest(data);
        setHoldings(latest);
      })
      .catch(() => setError("종목 데이터를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }

  // 같은 계좌+종목이면 최신 날짜만 유지
  function dedupeLatest(items: Holding[]): Holding[] {
    const map = new Map<string, Holding>();
    for (const item of items) {
      const key = `${item.accountName ?? ""}:${item.ticker}`;
      const existing = map.get(key);
      if (!existing || item.date > existing.date) {
        map.set(key, item);
      }
    }
    return [...map.values()];
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, portfolioId, refreshKey]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 종목을 삭제하시겠습니까?`)) return;
    await fetch(`/api/account-entries?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return <div className="animate-pulse text-foreground/60 text-sm py-4">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-danger text-sm rounded-xl border border-danger/20 bg-danger/5">
        {error}
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
        보유 종목이 없습니다.
      </div>
    );
  }

  return (
    <div className="-mx-4 sm:mx-0 overflow-x-auto rounded-xl border border-surface-dim">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-dim bg-surface-dim/50">
            <th className="text-left px-4 py-3 font-medium text-foreground/60">종목</th>
            <th className="text-left px-4 py-3 font-medium text-foreground/60">코드</th>
            <th className="text-left px-4 py-3 font-medium text-foreground/60">자산군</th>
            <th className="text-right px-4 py-3 font-medium text-foreground/60">수량</th>
            <th className="text-left px-4 py-3 font-medium text-foreground/60">기준일</th>
            {portfolioId && (
              <th className="text-left px-4 py-3 font-medium text-foreground/60">계좌</th>
            )}
            <th className="w-14"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id} className="border-b border-surface-dim last:border-0 hover:bg-surface-dim/30">
              <td className="px-4 py-3 font-medium">{h.name}</td>
              <td className="px-4 py-3 text-foreground/60 font-mono text-xs">{h.ticker}</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60">
                  {ASSET_CLASS_LABELS[h.assetClass ?? ""] || h.assetClass || "-"}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">{h.amount}</td>
              <td className="px-4 py-3 text-foreground/60 text-xs">{h.date}</td>
              {portfolioId && (
                <td className="px-4 py-3 text-foreground/60 text-xs">{h.accountName}</td>
              )}
              <td className="px-2 py-3">
                <button
                  onClick={() => handleDelete(h.id, h.name)}
                  aria-label={`${h.name} 삭제`}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/60 hover:text-danger transition-colors rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
