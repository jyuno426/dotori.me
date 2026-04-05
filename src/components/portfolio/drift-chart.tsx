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

interface HoldingDetail {
  ticker: string;
  name: string;
  shares: number;
  price: number | null;
  value: number;
  assetClass?: string;
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
      fetch(`/api/returns?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch(`/api/holdings?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch(`/api/target-allocations?portfolioId=${portfolioId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    ])
      .then(([returns, holdings, targets]: [{ holdingDetails: HoldingDetail[] }, { assetClass: string; ticker: string }[], TargetAllocation[]]) => {
        if (targets.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // holdingDetails에 assetClass가 없으므로 holdings에서 매핑
        const tickerAssetClass: Record<string, string> = {};
        for (const h of holdings) tickerAssetClass[h.ticker] = h.assetClass;

        // 현재 비중 계산 (평가액 기반)
        const classValues: Record<string, number> = {};
        let totalValue = 0;
        for (const hd of returns.holdingDetails) {
          const ac = tickerAssetClass[hd.ticker] || "cash";
          classValues[ac] = (classValues[ac] || 0) + hd.value;
          totalValue += hd.value;
        }

        // 목표 비중 맵
        const targetMap: Record<string, number> = {};
        for (const t of targets) targetMap[t.assetClass] = t.targetPercent;

        // 드리프트 계산
        const items: DriftItem[] = ASSET_CLASS_ORDER
          .filter((ac) => targetMap[ac] || classValues[ac])
          .map((ac) => {
            const current = totalValue > 0
              ? ((classValues[ac] || 0) / totalValue) * 100
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
