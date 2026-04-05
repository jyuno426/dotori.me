"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CASH_TICKER = "__CASH__";

interface ReturnsData {
  holdingDetails: { ticker: string; name: string; value: number }[];
  totalCash: number;
  totalValue: number;
}

interface TargetAllocation {
  ticker: string;
  name: string;
  targetPercent: number;
}

interface DriftItem {
  name: string;
  current: number;
  target: number;
  drift: number;
}

export function DriftChart({
  portfolioId,
  refreshKey = 0,
}: {
  portfolioId: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<DriftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/returns?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch(`/api/target-allocations?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    ])
      .then(([returns, targets]: [ReturnsData, TargetAllocation[]]) => {
        if (targets.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const totalValue = returns.totalValue;

        // 종목별 현재 비중 (평가액 기반)
        const tickerValues: Record<string, { name: string; value: number }> = {};
        for (const hd of returns.holdingDetails) {
          if (tickerValues[hd.ticker]) {
            tickerValues[hd.ticker].value += hd.value;
          } else {
            tickerValues[hd.ticker] = { name: hd.name, value: hd.value };
          }
        }
        // 현금
        tickerValues[CASH_TICKER] = { name: "현금", value: returns.totalCash };

        // 목표 비중 맵
        const targetMap: Record<string, number> = {};
        const targetNames: Record<string, string> = {};
        for (const t of targets) {
          targetMap[t.ticker] = t.targetPercent;
          targetNames[t.ticker] = t.name;
        }

        // 모든 ticker 합치기 (목표 또는 보유 중인 것)
        const allTickers = new Set([
          ...Object.keys(tickerValues),
          ...Object.keys(targetMap),
        ]);

        const items: DriftItem[] = [];
        for (const ticker of allTickers) {
          const target = targetMap[ticker] || 0;
          const currentValue = tickerValues[ticker]?.value || 0;
          const current = totalValue > 0
            ? (currentValue / totalValue) * 100
            : 0;
          const name = tickerValues[ticker]?.name || targetNames[ticker] || ticker;

          // 목표도 없고 현재 비중도 0이면 스킵
          if (target === 0 && current === 0) continue;

          items.push({
            name,
            current: Math.round(current * 10) / 10,
            target: Math.round(target * 10) / 10,
            drift: Math.round((current - target) * 10) / 10,
          });
        }

        // 목표 비중 큰 순으로 정렬
        items.sort((a, b) => b.target - a.target);

        setData(items);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [portfolioId, refreshKey]);

  if (loading) return <div className="animate-pulse text-foreground/60 text-sm">로딩 중...</div>;
  if (error) return <p className="text-danger text-sm">드리프트 데이터를 불러오는데 실패했습니다.</p>;

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-dim bg-surface p-5 text-center text-foreground/60 text-sm">
        목표 비중을 설정하면 드리프트 분석이 표시됩니다.
      </div>
    );
  }

  function driftColor(drift: number) {
    const abs = Math.abs(drift);
    if (abs <= 3) return "#28a745";
    if (abs <= 5) return "#ffc107";
    return "#dc3545";
  }

  const chartHeight = Math.max(data.length * 40, 120);

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground/70">
        현재 비중 vs 목표 비중
      </h2>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
            <YAxis type="category" dataKey="name" width={90} fontSize={12} />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name === "current" ? "현재" : "목표"]}
            />
            <Bar dataKey="target" name="목표" fill="#d4a574" opacity={0.5} barSize={12} radius={[0, 4, 4, 0]} />
            <Bar dataKey="current" name="현재" fill="#4f7942" barSize={12} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 드리프트 요약 */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((item) => (
          <div key={item.name} className="text-center p-2 rounded-lg bg-surface-dim/50">
            <p className="text-xs text-foreground/60 truncate">{item.name}</p>
            <p
              className="text-sm font-semibold"
              style={{ color: driftColor(item.drift) }}
            >
              {item.drift >= 0 ? "+" : ""}{item.drift}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
