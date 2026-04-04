"use client";

import { useState } from "react";

interface Props {
  accountId: string;
  onAdded: () => void;
}

export function AddHoldingForm({ accountId, onAdded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        ticker: form.get("ticker"),
        name: form.get("name"),
        assetClass: form.get("assetClass"),
        shares: Number(form.get("shares")),
      }),
    });

    if (res.ok) {
      onAdded();
    } else {
      const data = await res.json();
      setError(data.error ?? "종목 추가에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium mb-1">종목 코드</label>
          <input
            name="ticker"
            required
            className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예: 069500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">종목명</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예: KODEX 200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">자산군</label>
          <select
            name="assetClass"
            required
            className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="domestic_equity">국내 주식</option>
            <option value="foreign_equity">해외 주식</option>
            <option value="bond">채권</option>
            <option value="alternative">대안자산</option>
            <option value="cash">현금</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">보유 수량</label>
          <input
            name="shares"
            type="number"
            step="any"
            min="0"
            required
            className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예: 100"
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "추가 중..." : "종목 추가"}
        </button>
      </div>
    </form>
  );
}
