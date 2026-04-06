"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface Instrument {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
}

interface TargetAllocation {
  ticker: string;
  name: string;
  targetPercent: number;
}

interface CashFlowRow {
  key: string;
  flowType: "deposit" | "withdrawal";
  amount: string;
  memo: string;
}

interface Props {
  accountId: string;
  instruments: Instrument[];
  targetAllocations: TargetAllocation[];
  onSaved: () => void;
  onClose: () => void;
}

let cashFlowKeyCounter = 0;

export function SnapshotEntryForm({
  accountId,
  instruments,
  targetAllocations,
  onSaved,
  onClose,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [holdings, setHoldings] = useState<Record<string, string>>({});
  const [cashAmount, setCashAmount] = useState("");
  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>([]);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 비중 맵
  const targetMap: Record<string, number> = {};
  for (const ta of targetAllocations) {
    targetMap[ta.ticker] = ta.targetPercent;
  }

  // ESC로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  function addCashFlow() {
    setCashFlows((prev) => [
      ...prev,
      { key: `cf-${++cashFlowKeyCounter}`, flowType: "deposit", amount: "", memo: "" },
    ]);
  }

  function removeCashFlow(key: string) {
    setCashFlows((prev) => prev.filter((cf) => cf.key !== key));
  }

  function updateCashFlow(key: string, field: keyof CashFlowRow, value: string) {
    setCashFlows((prev) =>
      prev.map((cf) => (cf.key === key ? { ...cf, [field]: value } : cf)),
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const holdingsData = instruments
      .filter((inst) => {
        const val = Number(holdings[inst.ticker] || 0);
        return val > 0;
      })
      .map((inst) => ({
        ticker: inst.ticker,
        name: inst.name,
        assetClass: inst.assetClass,
        amount: Number(holdings[inst.ticker]),
      }));

    const cashFlowsData = cashFlows
      .filter((cf) => Number(cf.amount) > 0)
      .map((cf) => ({
        flowType: cf.flowType,
        amount: Number(cf.amount),
        memo: cf.memo || undefined,
      }));

    const res = await fetch("/api/account-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        date,
        holdings: holdingsData,
        cash: Number(cashAmount) || 0,
        cashFlows: cashFlowsData.length > 0 ? cashFlowsData : null,
        memo: memo || null,
      }),
    });

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-dim sticky top-0 bg-surface rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">새 기록 추가</h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground/60 hover:text-foreground transition-colors rounded-lg"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 보유 수량 */}
          {instruments.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">보유 수량</label>
              <div className="rounded-xl border border-surface-dim overflow-hidden">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-[1fr_80px_100px] gap-2 px-4 py-2.5 bg-surface-dim/50 text-xs font-medium text-foreground/60">
                  <span>종목명</span>
                  <span className="text-center">비중</span>
                  <span className="text-center">수량</span>
                </div>
                {/* 테이블 바디 */}
                <div className="divide-y divide-surface-dim">
                  {instruments.map((inst) => (
                    <div
                      key={inst.ticker}
                      className="grid grid-cols-[1fr_80px_100px] gap-2 items-center px-4 py-2.5"
                    >
                      <span className="text-sm font-medium truncate">{inst.name}</span>
                      <span className="text-sm text-foreground/60 text-center">
                        {targetMap[inst.ticker] != null
                          ? `${targetMap[inst.ticker]}%`
                          : "-"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={holdings[inst.ticker] ?? ""}
                        onChange={(e) =>
                          setHoldings((prev) => ({ ...prev, [inst.ticker]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-surface-dim px-3 py-1.5 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 예수금 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">예수금</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-lg border border-surface-dim px-3 py-2 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-sm text-foreground/60 shrink-0">원</span>
            </div>
          </div>

          {/* 입출금 내역 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">입출금 내역</label>
              <button
                type="button"
                onClick={addCashFlow}
                className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
              >
                <Plus size={14} />
                추가
              </button>
            </div>
            {cashFlows.length === 0 ? (
              <p className="text-sm text-foreground/40 italic">
                입출금이 없으면 비워두세요
              </p>
            ) : (
              <div className="space-y-2">
                {cashFlows.map((cf) => (
                  <div key={cf.key} className="flex items-center gap-2">
                    <select
                      value={cf.flowType}
                      onChange={(e) => updateCashFlow(cf.key, "flowType", e.target.value)}
                      className="rounded-lg border border-surface-dim px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="deposit">입금</option>
                      <option value="withdrawal">출금</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={cf.amount}
                      onChange={(e) => updateCashFlow(cf.key, "amount", e.target.value)}
                      placeholder="금액"
                      className="w-32 rounded-lg border border-surface-dim px-3 py-2 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      value={cf.memo}
                      onChange={(e) => updateCashFlow(cf.key, "memo", e.target.value)}
                      placeholder="메모"
                      className="flex-1 rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeCashFlow(cf.key)}
                      className="p-2 text-foreground/40 hover:text-danger transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">메모</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택 사항"
              className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-dim sticky bottom-0 bg-surface rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-surface-dim px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-dim/50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "저장 중..." : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
