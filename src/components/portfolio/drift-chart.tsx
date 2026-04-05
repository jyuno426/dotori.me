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
  Cell,
  ReferenceLine,
} from "recharts";

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
  alternative: "대안자산",
  cash: "현금",
};

const ASSET_CLASS_ORDER = ["domestic_equity", "foreign_equity", "bond", "alternative", "cash"];

interface Holding {
  assetClass: string;
  shares: number;
}

interface TargetAllocation {
  assetClass: string;
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
      fetch(`/api/holdings?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch(`/api/target-allocations?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    ])
      .then(([holdings, targets]: [Holding[], TargetAllocation[]]) => {
        if (targets.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // 현재 비중 계산 (종목 수 기반)
        const totalHoldings = holdings.length;
        const classCounts: Record<string, number> = {};
        for (const h of holdings) {
          classCounts[h.assetClass] = (classCounts[h.assetClass] || 0) + 1;
        }

        // 목표 비중 맵
        const targetMap: Record<string, number> = {};
        for (const t of targets) targetMap[t.assetClass] = t.targetPercent;

        // 드리프트 계산
        const items: DriftItem[] = ASSET_CLASS_ORDER
          .filter((ac) => targetMap[ac] || classCounts[ac])
          .map((ac) => {
            const current = totalHoldings > 0
              ? ((classCounts[ac] || 0) / totalHoldings) * 100
              : 0;
            const target = targetMap[ac] || 0;
            return {
              name: ASSET_CLASS_LABELS[ac] || ac,
              current: Math.round(current * 10) / 10,
              target: Math.round(target * 10) / 10,
              drift: Math.round((current - target) * 10) / 10,
            };
          });

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
    if (abs <= 3) return "#28a745"; // success green
    if (abs <= 5) return "#ffc107"; // warning yellow
    return "#dc3545"; // danger red
  }

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground/70">
        현재 비중 vs 목표 비중
      </h2>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
            <YAxis type="category" dataKey="name" width={70} fontSize={12} />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name === "current" ? "현재" : "목표"]}
            />
            <Bar dataKey="target" name="목표" fill="#d4a574" opacity={0.5} barSize={12} radius={[0, 4, 4, 0]} />
            <Bar dataKey="current" name="현재" fill="#4f7942" barSize={12} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 드리프트 요약 */}
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {data.map((item) => (
          <div key={item.name} className="text-center p-2 rounded-lg bg-surface-dim/50">
            <p className="text-xs text-foreground/60">{item.name}</p>
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
