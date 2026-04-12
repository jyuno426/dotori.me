"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ListChecks, Save, Check } from "lucide-react";
import { SecuritySearch } from "@/components/ui/security-search";

const DEFAULT_ASSET_CLASSES = [
  { value: "domestic_equity", label: "국내 주식" },
  { value: "foreign_equity", label: "해외 주식" },
  { value: "bond", label: "채권" },
  { value: "alternative", label: "대안자산" },
];

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
  alternative: "대안자산",
};

interface Instrument {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  assetClass: string;
}

interface TargetAllocation {
  ticker: string;
  name: string;
  targetPercent: number;
}

interface Props {
  portfolioId: string;
  instruments: Instrument[];
  onChanged: () => void;
}

export function InstrumentManager({ portfolioId, instruments, onChanged }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 검색으로 선택한 종목의 자산군을 수정할 수 있도록
  const [pendingSecurity, setPendingSecurity] = useState<{
    ticker: string;
    name: string;
    assetClass: string;
  } | null>(null);
  const [customAssetClass, setCustomAssetClass] = useState("");
  const [useCustomAssetClass, setUseCustomAssetClass] = useState(false);

  // 비중 설정 (통합)
  const [targetValues, setTargetValues] = useState<Record<string, number>>({});
  const [targetLoading, setTargetLoading] = useState(true);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);
  const [targetError, setTargetError] = useState("");

  // 기존 자산군 목록 (사용자가 추가한 것 포함)
  const existingAssetClasses = Array.from(
    new Set(instruments.map((i) => i.assetClass))
  ).filter((ac) => !DEFAULT_ASSET_CLASSES.some((d) => d.value === ac));

  // 비중 데이터 로드
  useEffect(() => {
    fetch(`/api/target-allocations?portfolioId=${portfolioId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((rows: TargetAllocation[]) => {
        const map: Record<string, number> = {};
        for (const r of rows) map[r.ticker] = r.targetPercent;
        setTargetValues(map);
      })
      .catch(() => {})
      .finally(() => setTargetLoading(false));
  }, [portfolioId, instruments]);

  async function addInstrument(ticker: string, name: string, assetClass: string) {
    setSaving(true);
    setError("");

    const res = await fetch("/api/instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId, ticker, name, assetClass }),
    });

    if (res.ok) {
      onChanged();
      setShowForm(false);
      setPendingSecurity(null);
      setCustomAssetClass("");
      setUseCustomAssetClass(false);
    } else {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
    }
    setSaving(false);
  }

  function handleSearchSelect(security: { ticker: string; name: string; assetClass: string }) {
    // 자산군 확인/수정할 수 있도록 pending 상태로
    setPendingSecurity(security);
    setUseCustomAssetClass(false);
    setCustomAssetClass("");
  }

  function handleConfirmAdd() {
    if (!pendingSecurity) return;
    const assetClass = useCustomAssetClass && customAssetClass.trim()
      ? customAssetClass.trim()
      : pendingSecurity.assetClass;
    addInstrument(pendingSecurity.ticker, pendingSecurity.name, assetClass);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 종목을 삭제하시겠습니까?")) return;
    await fetch(`/api/instruments?id=${id}`, { method: "DELETE" });
    onChanged();
  }

  // 비중 저장
  const total = Object.values(targetValues).reduce((s, v) => s + (v || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;

  async function handleSaveTargets() {
    setTargetSaving(true);
    setTargetError("");
    setTargetSaved(false);

    const allocations = instruments.map((inst) => ({
      ticker: inst.ticker,
      name: inst.name,
      targetPercent: targetValues[inst.ticker] || 0,
    }));

    const res = await fetch("/api/target-allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId, allocations }),
    });

    if (res.ok) {
      setTargetSaved(true);
      onChanged();
      setTimeout(() => setTargetSaved(false), 2000);
    } else {
      const data = await res.json();
      setTargetError(data.error ?? "저장에 실패했습니다.");
    }
    setTargetSaving(false);
  }

  function getAssetClassLabel(value: string) {
    return ASSET_CLASS_LABELS[value] || value;
  }

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground/70 flex items-center gap-1.5">
          <ListChecks size={14} />
          종목 및 비중 설정
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setPendingSecurity(null);
          }}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          <Plus size={14} />
          {showForm ? "닫기" : "종목 추가"}
        </button>
      </div>

      {/* 종목 검색 추가 */}
      {showForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          {!pendingSecurity ? (
            <>
              <p className="text-xs font-medium text-foreground/60">종목 검색</p>
              <SecuritySearch
                onSelect={handleSearchSelect}
                placeholder="ETF 이름 또는 종목코드 검색"
              />
              {saving && <p className="text-xs text-foreground/60 mt-1">추가 중...</p>}
            </>
          ) : (
            /* 자산군 확인/수정 후 추가 */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{pendingSecurity.name}</span>
                <span className="text-xs text-foreground/50 font-mono">{pendingSecurity.ticker}</span>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">자산군</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEFAULT_ASSET_CLASSES.map((ac) => (
                    <button
                      key={ac.value}
                      type="button"
                      onClick={() => {
                        setPendingSecurity({ ...pendingSecurity, assetClass: ac.value });
                        setUseCustomAssetClass(false);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        !useCustomAssetClass && pendingSecurity.assetClass === ac.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-surface-dim text-foreground/60 hover:border-primary/30"
                      }`}
                    >
                      {ac.label}
                    </button>
                  ))}
                  {existingAssetClasses.map((ac) => (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => {
                        setPendingSecurity({ ...pendingSecurity, assetClass: ac });
                        setUseCustomAssetClass(false);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        !useCustomAssetClass && pendingSecurity.assetClass === ac
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-surface-dim text-foreground/60 hover:border-primary/30"
                      }`}
                    >
                      {ac}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseCustomAssetClass(true)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      useCustomAssetClass
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-surface-dim text-foreground/60 hover:border-primary/30"
                    }`}
                  >
                    + 직접 입력
                  </button>
                </div>
                {useCustomAssetClass && (
                  <input
                    value={customAssetClass}
                    onChange={(e) => setCustomAssetClass(e.target.value)}
                    placeholder="자산군 이름 입력"
                    className="w-full rounded-lg border border-surface-dim px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPendingSecurity(null)}
                  className="text-xs text-foreground/60 hover:text-foreground"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={saving || (useCustomAssetClass && !customAssetClass.trim())}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? "추가 중..." : "추가"}
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}

      {/* 종목 + 비중 통합 테이블 */}
      {instruments.length === 0 ? (
        <div className="text-center py-6 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
          등록된 종목이 없습니다. 종목을 추가해주세요.
        </div>
      ) : (
        <>
          {/* 헤더 */}
          <div className="grid grid-cols-[1fr_80px_40px_32px] sm:grid-cols-[1fr_120px_80px_40px_32px] gap-2 items-center px-3 py-1.5 text-xs font-medium text-foreground/50 border-b border-surface-dim">
            <span>종목</span>
            <span className="hidden sm:block">자산군</span>
            <span className="text-right">비중(%)</span>
            <span></span>
            <span></span>
          </div>

          {/* 종목 행 */}
          <div className="divide-y divide-surface-dim">
            {instruments.map((inst) => (
              <div
                key={inst.id}
                className="grid grid-cols-[1fr_80px_40px_32px] sm:grid-cols-[1fr_120px_80px_40px_32px] gap-2 items-center px-3 py-2 hover:bg-surface-dim/30"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium truncate block">{inst.name}</span>
                  <span className="text-xs text-foreground/50 font-mono">{inst.ticker}</span>
                </div>
                <span className="hidden sm:block text-xs px-1.5 py-0.5 rounded-full bg-surface-dim text-foreground/50 text-center truncate">
                  {getAssetClassLabel(inst.assetClass)}
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={targetValues[inst.ticker] ?? ""}
                  onChange={(e) =>
                    setTargetValues((v) => ({ ...v, [inst.ticker]: Number(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="w-full rounded border border-surface-dim px-2 py-1 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <span className="text-xs text-foreground/50">%</span>
                <button
                  onClick={() => handleDelete(inst.id)}
                  className="p-1 text-foreground/40 hover:text-danger transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 합계 + 저장 */}
          <div className="flex items-center justify-between pt-3 border-t border-surface-dim">
            <p className={`text-sm font-medium ${isValid ? "text-success" : total > 0 ? "text-danger" : "text-foreground/50"}`}>
              합계: {total.toFixed(1)}%
              {!isValid && total > 0 && <span className="text-xs ml-1">(100%가 되어야 합니다)</span>}
            </p>
            <div className="flex items-center gap-2">
              {targetSaved && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check size={14} />
                  저장됨
                </span>
              )}
              <button
                onClick={handleSaveTargets}
                disabled={!isValid || targetSaving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {targetSaving ? "저장 중..." : "비중 저장"}
              </button>
            </div>
          </div>

          {targetError && <p className="text-danger text-sm">{targetError}</p>}
        </>
      )}
    </div>
  );
}
