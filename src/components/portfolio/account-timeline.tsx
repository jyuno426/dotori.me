"use client";

import { useEffect, useState } from "react";
import { Trash2, ArrowDownCircle, ArrowUpCircle, Wallet, BarChart3 } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface Entry {
  id: string;
  accountId: string;
  date: string;
  type: string;
  ticker: string;
  name: string;
  assetClass: string | null;
  amount: number;
  memo: string | null;
}

interface DateGroup {
  date: string;
  entries: Entry[];
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
}: {
  accountId: string;
  refreshKey?: number;
}) {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/account-entries?accountId=${accountId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Entry[]) => {
        // 날짜별 그룹핑
        const map = new Map<string, Entry[]>();
        for (const entry of data) {
          const list = map.get(entry.date) ?? [];
          list.push(entry);
          map.set(entry.date, list);
        }
        // 최신 날짜가 상단
        const sorted = [...map.entries()]
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, entries]) => ({ date, entries }));
        setGroups(sorted);
      })
      .catch(() => setError("기록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [accountId, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    await fetch(`/api/account-entries?id=${id}`, { method: "DELETE" });
    // 리로드
    setLoading(true);
    fetch(`/api/account-entries?accountId=${accountId}`)
      .then((r) => r.json())
      .then((data: Entry[]) => {
        const map = new Map<string, Entry[]>();
        for (const entry of data) {
          const list = map.get(entry.date) ?? [];
          list.push(entry);
          map.set(entry.date, list);
        }
        const sorted = [...map.entries()]
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, entries]) => ({ date, entries }));
        setGroups(sorted);
      })
      .finally(() => setLoading(false));
  }

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (loading) return <div className="animate-pulse text-foreground/60 text-sm">로딩 중...</div>;

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
        기록이 없습니다. 위 폼에서 데이터를 입력해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.date} className="rounded-xl border border-surface-dim bg-surface overflow-hidden">
          {/* 날짜 헤더 */}
          <div className="px-4 py-2 bg-surface-dim/50 border-b border-surface-dim">
            <span className="text-sm font-semibold text-foreground/70">{group.date}</span>
            <span className="text-xs text-foreground/50 ml-2">{group.entries.length}건</span>
          </div>

          {/* 엔트리 목록 */}
          <div className="divide-y divide-surface-dim">
            {group.entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-dim/30">
                {/* 아이콘 */}
                <div className="shrink-0">
                  {entry.type === "holding" && <BarChart3 size={16} className="text-primary" />}
                  {entry.type === "cash" && <Wallet size={16} className="text-primary" />}
                  {entry.type === "cash_flow" && entry.amount > 0 && (
                    <ArrowDownCircle size={16} className="text-success" />
                  )}
                  {entry.type === "cash_flow" && entry.amount < 0 && (
                    <ArrowUpCircle size={16} className="text-danger" />
                  )}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {entry.type === "holding" ? entry.name : entry.type === "cash" ? "예수금" : entry.amount > 0 ? "입금" : "출금"}
                    </span>
                    {entry.type === "holding" && (
                      <>
                        <span className="text-xs text-foreground/50 font-mono">{entry.ticker}</span>
                        {entry.assetClass && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-dim text-foreground/50">
                            {ASSET_CLASS_LABELS[entry.assetClass] || entry.assetClass}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {entry.memo && (
                    <p className="text-xs text-foreground/50 truncate">{entry.memo}</p>
                  )}
                </div>

                {/* 금액/수량 */}
                <div className="shrink-0 text-right">
                  {entry.type === "holding" ? (
                    <span className="text-sm font-mono">{entry.amount}주</span>
                  ) : (
                    <span className={`text-sm font-medium ${
                      entry.type === "cash_flow"
                        ? entry.amount > 0 ? "text-success" : "text-danger"
                        : ""
                    }`}>
                      {formatKRW(Math.abs(entry.amount))}
                    </span>
                  )}
                </div>

                {/* 삭제 */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 p-1.5 text-foreground/40 hover:text-danger transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
