"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface CashFlow {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  memo: string | null;
}

interface Summary {
  totalDeposit: number;
  totalWithdrawal: number;
  net: number;
}

export function CashFlowSection({
  accountId,
  refreshKey = 0,
  showFormInitially = false,
}: {
  accountId: string;
  refreshKey?: number;
  showFormInitially?: boolean;
}) {
  const [items, setItems] = useState<CashFlow[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalDeposit: 0, totalWithdrawal: 0, net: 0 });
  const [showForm, setShowForm] = useState(showFormInitially);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    setShowForm(showFormInitially);
  }, [showFormInitially]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cash-flows?accountId=${accountId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setItems(data.items);
        setSummary(data.summary);
      })
      .catch(() => setError("입출금 데이터를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [accountId, refreshKey, localRefresh]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const type = form.get("type") as string;
    const rawAmount = Number(form.get("amount"));
    const amount = type === "withdrawal" ? -rawAmount : rawAmount;

    const res = await fetch("/api/cash-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        date: form.get("date"),
        amount,
        memo: form.get("memo") || null,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setLocalRefresh((k) => k + 1);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 입출금 기록을 삭제하시겠습니까?")) return;
    await fetch(`/api/cash-flows?id=${id}`, { method: "DELETE" });
    setLocalRefresh((k) => k + 1);
  }

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (loading) return <div className="animate-pulse text-foreground/60 text-sm">로딩 중...</div>;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      {/* 요약 */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-lg border border-surface-dim bg-surface p-3 text-center">
          <p className="text-xs text-foreground/60">총 입금</p>
          <p className="text-sm font-semibold text-success">{formatKRW(summary.totalDeposit)}</p>
        </div>
        <div className="rounded-lg border border-surface-dim bg-surface p-3 text-center">
          <p className="text-xs text-foreground/60">총 출금</p>
          <p className="text-sm font-semibold text-danger">{formatKRW(Math.abs(summary.totalWithdrawal))}</p>
        </div>
        <div className="rounded-lg border border-surface-dim bg-surface p-3 text-center">
          <p className="text-xs text-foreground/60">순 입출금</p>
          <p className={`text-sm font-semibold ${summary.net >= 0 ? "text-success" : "text-danger"}`}>
            {formatKRW(summary.net)}
          </p>
        </div>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">날짜 <span className="text-danger">*</span></label>
              <input
                type="date"
                name="date"
                defaultValue={today}
                required
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">유형 <span className="text-danger">*</span></label>
              <select
                name="type"
                required
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="deposit">입금</option>
                <option value="withdrawal">출금</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">금액 (원) <span className="text-danger">*</span></label>
              <input
                type="number"
                name="amount"
                min="1"
                required
                placeholder="100000"
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">메모</label>
              <input
                type="text"
                name="memo"
                placeholder="월 적립금"
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-surface-dim px-4 py-2 text-sm font-medium hover:bg-surface-dim transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 내역 리스트 */}
      {items.length === 0 ? (
        <div className="text-center py-6 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
          입출금 내역이 없습니다.
        </div>
      ) : (
        <div className="-mx-4 sm:mx-0 overflow-x-auto rounded-xl border border-surface-dim">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-dim bg-surface-dim/50">
                <th className="text-left px-4 py-3 font-medium text-foreground/60">날짜</th>
                <th className="text-left px-4 py-3 font-medium text-foreground/60">유형</th>
                <th className="text-right px-4 py-3 font-medium text-foreground/60">금액</th>
                <th className="text-left px-4 py-3 font-medium text-foreground/60">메모</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-surface-dim last:border-0 hover:bg-surface-dim/30">
                  <td className="px-4 py-3">{item.date}</td>
                  <td className="px-4 py-3">
                    {item.amount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <ArrowDownCircle size={14} />
                        입금
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger">
                        <ArrowUpCircle size={14} />
                        출금
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${item.amount > 0 ? "text-success" : "text-danger"}`}>
                    {formatKRW(Math.abs(item.amount))}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{item.memo || "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-foreground/40 hover:text-danger transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
