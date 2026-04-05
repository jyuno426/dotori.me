"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";

const ASSET_CLASSES = [
  { key: "domestic_equity", label: "국내 주식" },
  { key: "foreign_equity", label: "해외 주식" },
  { key: "bond", label: "채권" },
  { key: "alternative", label: "대안자산" },
  { key: "cash", label: "현금" },
];

interface TargetAllocation {
  assetClass: string;
  targetPercent: number;
}

export function TargetAllocationForm({
  portfolioId,
  onSaved,
}: {
  portfolioId: string;
  onSaved?: () => void;
}) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/target-allocations?portfolioId=${portfolioId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((rows: TargetAllocation[]) => {
        const map: Record<string, number> = {};
        for (const r of rows) map[r.assetClass] = r.targetPercent;
        setValues(map);
      })
      .catch(() => setError("목표 비중 데이터를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [portfolioId]);

  const total = Object.values(values).reduce((s, v) => s + (v || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    const allocations = ASSET_CLASSES.map((ac) => ({
      assetClass: ac.key,
      targetPercent: values[ac.key] || 0,
    }));

    const res = await fetch("/api/target-allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId, allocations }),
    });

    if (res.ok) {
      setSuccess(true);
      onSaved?.();
      setTimeout(() => setSuccess(false), 2000);
    } else {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
    }
    setSaving(false);
  }

  if (loading) return <div className="animate-pulse text-foreground/60 text-sm">로딩 중...</div>;

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground/70 flex items-center gap-1.5">
        <Target size={14} />
        목표 비중 설정
      </h2>

      <div className="space-y-2">
        {ASSET_CLASSES.map((ac) => (
          <div key={ac.key} className="flex items-center gap-3">
            <label className="text-sm w-24 shrink-0">{ac.label}</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={values[ac.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [ac.key]: Number(e.target.value) || 0 }))
              }
              placeholder="0"
              className="w-24 rounded-lg border border-surface-dim px-3 py-1.5 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-sm text-foreground/60">%</span>
            {/* 비중 바 */}
            <div className="flex-1 h-2 bg-surface-dim rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(values[ac.key] || 0, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-surface-dim">
        <p className={`text-sm font-medium ${isValid ? "text-success" : "text-danger"}`}>
          합계: {total.toFixed(1)}%
          {!isValid && total > 0 && <span className="text-xs ml-1">(100%가 되어야 합니다)</span>}
        </p>
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? "저장 중..." : success ? "저장됨" : "저장"}
        </button>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
