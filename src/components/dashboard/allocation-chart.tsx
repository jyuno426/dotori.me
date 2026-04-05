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
  const [error, setError] = useState(false);

  useEffect(() => {
    if (portfolioIds.length === 0) return;

    Promise.all(
      portfolioIds.map((id) =>
        fetch(`/api/holdings?portfolioId=${id}`).then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
      )
    )
      .then((results) => setHoldings(results.flat()))
      .catch(() => setError(true));
  }, [portfolioIds]);

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-5 text-center text-danger text-sm">
        차트 데이터를 불러오는데 실패했습니다.
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-dim bg-surface p-5 text-center text-foreground/60 text-sm">
        종목을 등록하면 자산 배분 차트가 표시됩니다.
      </div>
    );
  }

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
      <h2 className="text-sm font-semibold text-foreground/70 mb-4">
        자산군별 종목 분포
      </h2>
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
