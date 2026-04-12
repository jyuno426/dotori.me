"use client";

import { useEffect, useState } from "react";
import { Trash2, Pencil, ArrowDownCircle, ArrowUpCircle, Wallet, BarChart3 } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface HoldingEntry {
  ticker: string;
  name: string;
  assetClass: string;
  amount: number;
}

interface CashFlowEntry {
  flowType: string;
  amount: number;
  memo?: string;
}

interface Snapshot {
  id: string;
  accountId: string;
  date: string;
  holdings: string; // JSON
  cash: number;
  cashFlows: string | null; // JSON
  memo: string | null;
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외 주식",
  bond: "채권",
  alternative: "대안자산",
};

export function AccountTimeline({
  accountId,
  refreshKey = 0,
  onEdit,
}: {
  accountId: string;
  refreshKey?: number;
  onEdit?: (snapshot: Snapshot) => void;
}) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/account-entries?accountId=${accountId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Snapshot[]) => {
        setSnapshots(data);
      })
      .catch(() => setError("기록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    await fetch(`/api/account-entries?id=${id}`, { method: "DELETE" });
    load();
  }

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (loading) return <div className="animate-pulse text-foreground/60 text-sm">로딩 중...</div>;

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
        기록이 없습니다. 위에서 새 기록을 추가해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snapshots.map((snap) => {
        const holdings: HoldingEntry[] = JSON.parse(snap.holdings);
        const cashFlows: CashFlowEntry[] = snap.cashFlows ? JSON.parse(snap.cashFlows) : [];

        return (
          <div key={snap.id} className="rounded-xl border border-surface-dim bg-surface overflow-hidden">
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-dim/50 border-b border-surface-dim">
              <div>
                <span className="text-sm font-semibold text-foreground/70">{snap.date}</span>
                <span className="text-xs text-foreground/50 ml-2">
                  {holdings.length}종목
                  {snap.cash > 0 && ` · 예수금 ${formatKRW(snap.cash)}`}
                  {cashFlows.length > 0 && ` · 입출금 ${cashFlows.length}건`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(snap)}
                    className="p-1.5 text-foreground/40 hover:text-primary transition-colors"
                    aria-label="수정"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(snap.id)}
                  className="p-1.5 text-foreground/40 hover:text-danger transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="divide-y divide-surface-dim">
              {/* 보유 종목 */}
              {holdings.map((h) => (
                <div key={h.ticker} className="flex items-center gap-3 px-4 py-2.5">
                  <BarChart3 size={16} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{h.name}</span>
                      <span className="text-xs text-foreground/50 font-mono">{h.ticker}</span>
                      {h.assetClass && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-dim text-foreground/50">
                          {ASSET_CLASS_LABELS[h.assetClass] || h.assetClass}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono shrink-0">{h.amount}주</span>
                </div>
              ))}

              {/* 예수금 */}
              {snap.cash > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <Wallet size={16} className="text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1">예수금</span>
                  <span className="text-sm font-medium shrink-0">{formatKRW(snap.cash)}</span>
                </div>
              )}

              {/* 입출금 */}
              {cashFlows.map((cf, idx) => {
                const isDeposit = cf.flowType === "deposit";
                return (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                    {isDeposit ? (
                      <ArrowDownCircle size={16} className="text-success shrink-0" />
                    ) : (
                      <ArrowUpCircle size={16} className="text-danger shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">
                        {isDeposit ? "입금" : "출금"}
                      </span>
                      {cf.memo && (
                        <p className="text-xs text-foreground/50 truncate">{cf.memo}</p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium shrink-0 ${isDeposit ? "text-success" : "text-danger"}`}
                    >
                      {formatKRW(cf.amount)}
                    </span>
                  </div>
                );
              })}

              {/* 메모 */}
              {snap.memo && (
                <div className="px-4 py-2.5">
                  <p className="text-xs text-foreground/50">{snap.memo}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
