"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface CashBalance {
  id: string;
  accountId: string;
  date: string;
  balance: number;
}

export function CashBalanceCard({
  accountId,
  refreshKey = 0,
}: {
  accountId: string;
  refreshKey?: number;
}) {
  const [current, setCurrent] = useState<CashBalance | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cash-balances?accountId=${accountId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setCurrent)
      .catch(() => setCurrent(null))
      .finally(() => setLoading(false));
  }, [accountId, refreshKey, localRefresh]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/cash-balances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        date: form.get("date"),
        balance: Number(form.get("balance")),
      }),
    });
    if (res.ok) {
      setEditing(false);
      setLocalRefresh((k) => k + 1);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  if (loading) return null;

  return (
    <div className="rounded-xl border border-surface-dim bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/70 flex items-center gap-1.5">
          <Wallet size={14} />
          예수금 잔액
        </h3>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-primary font-medium hover:underline"
        >
          {editing ? "취소" : "수정"}
        </button>
      </div>

      {current ? (
        <div className="mt-2">
          <p className="text-lg font-bold">{formatKRW(current.balance)}</p>
          <p className="text-xs text-foreground/60">기준일: {current.date}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-foreground/60">등록된 예수금이 없습니다.</p>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <div className="grid gap-2 grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">기준일</label>
              <input
                type="date"
                name="date"
                defaultValue={current?.date ?? today}
                required
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">잔액 (원)</label>
              <input
                type="number"
                name="balance"
                defaultValue={current?.balance ?? ""}
                min="0"
                required
                placeholder="0"
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            저장
          </button>
        </form>
      )}
    </div>
  );
}
