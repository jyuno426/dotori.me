"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { formatKRW, formatPercent } from "@/lib/utils";

interface ReturnData {
  totalValue: number;
  holdingsValue: number;
  totalCash: number;
  totalDeposit: number;
  totalWithdrawal: number;
  netInvested: number;
  profitLoss: number;
  returnRate: number;
  missingPrices: string[];
}

export function ReturnSummary({
  portfolioId,
  refreshKey = 0,
}: {
  portfolioId: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/returns?portfolioId=${portfolioId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [portfolioId, refreshKey]);

  if (loading) return <div className="animate-pulse text-foreground/60 text-sm">로딩 중...</div>;
  if (!data) return null;

  const isProfit = data.profitLoss >= 0;
  const hasData = data.netInvested > 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-dim bg-surface p-4">
          <p className="text-xs text-foreground/60">총 평가액</p>
          <p className="text-lg font-bold mt-1">{formatKRW(data.totalValue)}</p>
        </div>
        <div className="rounded-xl border border-surface-dim bg-surface p-4">
          <p className="text-xs text-foreground/60">투자 원금</p>
          <p className="text-lg font-bold mt-1">{formatKRW(data.netInvested)}</p>
        </div>
        <div className="rounded-xl border border-surface-dim bg-surface p-4">
          <p className="text-xs text-foreground/60">평가 손익</p>
          <p className={`text-lg font-bold mt-1 flex items-center gap-1 ${isProfit ? "text-success" : "text-danger"}`}>
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {formatKRW(Math.abs(data.profitLoss))}
          </p>
        </div>
        <div className="rounded-xl border border-surface-dim bg-surface p-4">
          <p className="text-xs text-foreground/60">수익률</p>
          <p className={`text-lg font-bold mt-1 ${isProfit ? "text-success" : "text-danger"}`}>
            {hasData ? formatPercent(data.returnRate) : "-"}
          </p>
        </div>
      </div>

      {data.missingPrices.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground/80">가격 미입력 종목</p>
            <p className="text-foreground/60 text-xs mt-0.5">
              {data.missingPrices.join(", ")} — 현재가를 입력하면 정확한 수익률이 계산됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
