"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const ASSET_CLASS_LABELS: Record<string, string> = {
  developed_equity: "선진국 주식",
  emerging_equity: "신흥국 주식",
  developed_bond: "선진국 채권",
  emerging_bond: "신흥국 채권",
  alternative: "대체자산",
  cash: "현금성",
  // 하위 호환
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
};

const COLORS = ["#4f7942", "#6b9f5b", "#d4a574", "#8b6f47", "#a0a0a0", "#c9b896", "#7b9e6c", "#b8956a"];

interface Holding {
  ticker: string;
  name: string;
  assetClass: string | null;
  amount: number;
  date: string;
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
        fetch(`/api/account-entries?portfolioId=${id}&type=holding`).then((r) => {
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

  // 자산군별 종목 그룹핑
  const groups: Record<string, { count: number; items: { name: string; amount: number }[] }> = {};
  for (const h of holdings) {
    const cls = h.assetClass && h.assetClass.trim() ? h.assetClass : "미분류";
    if (!groups[cls]) groups[cls] = { count: 0, items: [] };
    groups[cls].count += 1;
    const existing = groups[cls].items.find((i) => i.name === h.name);
    if (existing) {
      existing.amount += h.amount;
    } else {
      groups[cls].items.push({ name: h.name, amount: h.amount });
    }
  }

  const chartData = Object.entries(groups).map(([key, { count }]) => ({
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

      {/* 자산군별 개별 종목 분포 */}
      <div className="mt-4 space-y-3">
        {Object.entries(groups).map(([key, { items }], gi) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[gi % COLORS.length] }}
              />
              <span className="text-xs font-medium text-foreground/70">
                {ASSET_CLASS_LABELS[key] || key} ({items.length}종목)
              </span>
            </div>
            <div className="flex flex-wrap gap-1 ml-5">
              {items.map((item) => (
                <span
                  key={item.name}
                  className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60"
                >
                  {item.name} {item.amount}주
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
