"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
  alternative: "대안자산",
  cash: "현금",
};

const COLORS = ["#4f7942", "#6b9f5b", "#d4a574", "#8b6f47", "#a0a0a0"];

interface Holding {
  ticker: string;
  name: string;
  assetClass: string;
  shares: number;
}

interface Props {
  portfolioIds: string[];
}

export function AllocationChart({ portfolioIds }: Props) {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    if (portfolioIds.length === 0) return;

    Promise.all(
      portfolioIds.map((id) =>
        fetch(`/api/holdings?portfolioId=${id}`).then((r) => r.json())
      )
    ).then((results) => {
      setHoldings(results.flat());
    });
  }, [portfolioIds]);

  if (holdings.length === 0) {
    return null;
  }

  // 자산군별 종목 수 집계 (시세 데이터 없이 종목 수 기준으로 표시)
  const assetClassCounts = holdings.reduce(
    (acc, h) => {
      acc[h.assetClass] = (acc[h.assetClass] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const chartData = Object.entries(assetClassCounts).map(([key, count]) => ({
    name: ASSET_CLASS_LABELS[key] || key,
    value: count,
  }));

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground/60 mb-4">
        자산군별 종목 분포
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
