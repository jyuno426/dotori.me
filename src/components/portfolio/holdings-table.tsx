"use client";

import { useEffect, useState } from "react";

interface HoldingEntry {
  ticker: string;
  name: string;
  assetClass: string;
  amount: number;
}

interface Snapshot {
  id: string;
  accountId: string;
  date: string;
  holdings: string; // JSON
  accountName?: string;
}

interface HoldingRow {
  ticker: string;
  name: string;
  assetClass: string | null;
  amount: number;
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
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setError("");
    const url = accountId
      ? `/api/account-entries?accountId=${accountId}`
      : `/api/account-entries?portfolioId=${portfolioId}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Snapshot[]) => {
        // 각 계좌+종목 조합별 최신 스냅샷에서 보유 종목 추출
        const latest = extractLatestHoldings(data);
        setHoldings(latest);
      })
      .catch(() => setError("종목 데이터를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }

  // 스냅샷에서 최신 보유 종목 추출 (계좌+종목별 최신 날짜)
  function extractLatestHoldings(snapshots: Snapshot[]): HoldingRow[] {
    // 계좌별로 최신 스냅샷만 추출
    const latestByAccount = new Map<string, Snapshot>();
    for (const snap of snapshots) {
      const existing = latestByAccount.get(snap.accountId);
      if (!existing || snap.date > existing.date) {
        latestByAccount.set(snap.accountId, snap);
      }
    }

    const result: HoldingRow[] = [];
    for (const snap of latestByAccount.values()) {
      const entries: HoldingEntry[] = JSON.parse(snap.holdings);
      for (const h of entries) {
        if (h.amount <= 0) continue;
        result.push({
          ticker: h.ticker,
          name: h.name,
          assetClass: h.assetClass,
          amount: h.amount,
          date: snap.date,
          accountName: (snap as Snapshot & { accountName?: string }).accountName,
        });
      }
    }
    return result;
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, portfolioId, refreshKey]);

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
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, idx) => (
            <tr key={`${h.ticker}-${idx}`} className="border-b border-surface-dim last:border-0 hover:bg-surface-dim/30">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
