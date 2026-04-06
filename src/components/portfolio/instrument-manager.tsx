"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { SecuritySearch } from "@/components/ui/security-search";

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

interface Props {
  portfolioId: string;
  instruments: Instrument[];
  onChanged: () => void;
}

export function InstrumentManager({ portfolioId, instruments, onChanged }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 직접 입력 모드용 state
  const [manualTicker, setManualTicker] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualAssetClass, setManualAssetClass] = useState("domestic_equity");

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
      setManualTicker("");
      setManualName("");
      setManualAssetClass("domestic_equity");
    } else {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
    }
    setSaving(false);
  }

  function handleSearchSelect(security: { ticker: string; name: string; assetClass: string }) {
    addInstrument(security.ticker, security.name, security.assetClass);
  }

  function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ticker = manualTicker.trim().toUpperCase();
    const name = manualName.trim();
    if (!ticker || !name) {
      setError("종목 코드와 종목명을 입력해주세요.");
      return;
    }
    addInstrument(ticker, name, manualAssetClass);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 종목을 삭제하시겠습니까?")) return;
    await fetch(`/api/instruments?id=${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground/70 flex items-center gap-1.5">
          <ListChecks size={14} />
          종목 설정
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          <Plus size={14} />
          {showForm ? "닫기" : "종목 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          {/* 모드 전환 */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground/60">
              {manualMode ? "직접 입력" : "종목 검색"}
            </p>
            <button
              type="button"
              onClick={() => setManualMode(!manualMode)}
              className="text-xs text-primary hover:underline"
            >
              {manualMode ? "검색으로 전환" : "직접 입력"}
            </button>
          </div>

          {manualMode ? (
            /* 직접 입력 모드 */
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium mb-1">종목 코드 <span className="text-danger">*</span></label>
                  <input
                    value={manualTicker}
                    onChange={(e) => setManualTicker(e.target.value)}
                    required
                    className="w-full rounded-lg border border-surface-dim px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="예: 069500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">종목명 <span className="text-danger">*</span></label>
                  <input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-surface-dim px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="예: KODEX 200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">자산군 <span className="text-danger">*</span></label>
                  <select
                    value={manualAssetClass}
                    onChange={(e) => setManualAssetClass(e.target.value)}
                    required
                    className="w-full rounded-lg border border-surface-dim px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="domestic_equity">국내 주식</option>
                    <option value="foreign_equity">해외 주식</option>
                    <option value="bond">채권</option>
                    <option value="alternative">대안자산</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? "추가 중..." : "추가"}
                </button>
              </div>
            </form>
          ) : (
            /* 검색 모드 */
            <div>
              <SecuritySearch
                onSelect={handleSearchSelect}
                placeholder="ETF 이름 또는 종목코드 검색 (예: KODEX, 069500)"
              />
              {saving && <p className="text-xs text-foreground/60 mt-1">추가 중...</p>}
            </div>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}

      {/* 종목 목록 */}
      {instruments.length === 0 ? (
        <div className="text-center py-6 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
          등록된 종목이 없습니다. 종목을 추가해주세요.
        </div>
      ) : (
        <div className="divide-y divide-surface-dim rounded-lg border border-surface-dim overflow-hidden">
          {instruments.map((inst) => (
            <div key={inst.id} className="flex items-center gap-3 px-4 py-2.5 bg-surface hover:bg-surface-dim/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{inst.name}</span>
                  <span className="text-xs text-foreground/50 font-mono">{inst.ticker}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-dim text-foreground/50">
                    {ASSET_CLASS_LABELS[inst.assetClass] || inst.assetClass}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(inst.id)}
                className="shrink-0 p-1.5 text-foreground/40 hover:text-danger transition-colors"
                aria-label="삭제"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
