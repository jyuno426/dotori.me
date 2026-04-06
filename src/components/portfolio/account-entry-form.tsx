"use client";

import { useState } from "react";

type EntryType = "holding" | "cash" | "cash_flow";

const TYPE_LABELS: Record<EntryType, string> = {
  holding: "보유 종목",
  cash: "예수금",
  cash_flow: "입출금",
};

interface Instrument {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
}

interface Props {
  accountId: string;
  instruments?: Instrument[];
  onSaved: () => void;
}

export function AccountEntryForm({ accountId, instruments = [], onSaved }: Props) {
  const [entryType, setEntryType] = useState<EntryType>("holding");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [manualTicker, setManualTicker] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualAssetClass, setManualAssetClass] = useState("domestic_equity");

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const date = form.get("date") as string;

    let body: Record<string, unknown>;

    if (entryType === "holding") {
      body = {
        accountId,
        date,
        type: "holding",
        ticker: form.get("ticker"),
        name: form.get("name"),
        assetClass: form.get("assetClass"),
        amount: Number(form.get("amount")),
      };
    } else if (entryType === "cash") {
      body = {
        accountId,
        date,
        type: "cash",
        ticker: "__CASH__",
        name: "예수금",
        amount: Number(form.get("amount")),
      };
    } else {
      const flowType = form.get("flowType") as string;
      const rawAmount = Number(form.get("amount"));
      body = {
        accountId,
        date,
        type: "cash_flow",
        ticker: "__CASHFLOW__",
        name: "입출금",
        amount: flowType === "withdrawal" ? -rawAmount : rawAmount,
        memo: form.get("memo") || null,
      };
    }

    const res = await fetch("/api/account-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSaved();
      setSelectedInstrument("");
      setManualTicker("");
      setManualName("");
      setManualAssetClass("domestic_equity");
      (e.target as HTMLFormElement).reset();
    } else {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      {/* 탭 선택 */}
      <div className="flex gap-1 rounded-lg bg-surface-dim/50 p-1">
        {(["holding", "cash", "cash_flow"] as EntryType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setEntryType(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              entryType === t
                ? "bg-white shadow-sm text-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 공통: 날짜 */}
      <div>
        <label className="block text-xs font-medium mb-1">기준일 <span className="text-danger">*</span></label>
        <input
          type="date"
          name="date"
          defaultValue={today}
          required
          className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* 보유 종목 필드 */}
      {entryType === "holding" && (
        <div className="space-y-3">
          {instruments.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1">종목 선택</label>
              <select
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">직접 입력</option>
                {instruments.map((inst) => (
                  <option key={inst.id} value={inst.ticker}>
                    {inst.name} ({inst.ticker})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">종목 코드 <span className="text-danger">*</span></label>
              <input
                name="ticker"
                required
                value={selectedInstrument ? instruments.find((i) => i.ticker === selectedInstrument)?.ticker ?? "" : manualTicker}
                onChange={(e) => { if (!selectedInstrument) setManualTicker(e.target.value); }}
                readOnly={!!selectedInstrument}
                className={`w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedInstrument ? "bg-surface-dim/30" : ""}`}
                placeholder="예: 069500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">종목명 <span className="text-danger">*</span></label>
              <input
                name="name"
                required
                value={selectedInstrument ? instruments.find((i) => i.ticker === selectedInstrument)?.name ?? "" : manualName}
                onChange={(e) => { if (!selectedInstrument) setManualName(e.target.value); }}
                readOnly={!!selectedInstrument}
                className={`w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedInstrument ? "bg-surface-dim/30" : ""}`}
                placeholder="예: KODEX 200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">자산군 <span className="text-danger">*</span></label>
              <select
                name="assetClass"
                required
                value={selectedInstrument ? instruments.find((i) => i.ticker === selectedInstrument)?.assetClass ?? "domestic_equity" : manualAssetClass}
                onChange={(e) => { if (!selectedInstrument) setManualAssetClass(e.target.value); }}
                disabled={!!selectedInstrument}
                className={`w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedInstrument ? "bg-surface-dim/30" : ""}`}
              >
                <option value="domestic_equity">국내 주식</option>
                <option value="foreign_equity">해외 주식</option>
                <option value="bond">채권</option>
                <option value="alternative">대안자산</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">보유 수량 <span className="text-danger">*</span></label>
              <input
                name="amount"
                type="number"
                step="any"
                min="0"
                required
                className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="예: 100"
              />
            </div>
          </div>
        </div>
      )}

      {/* 예수금 필드 */}
      {entryType === "cash" && (
        <div>
          <label className="block text-xs font-medium mb-1">예수금 잔액 (원) <span className="text-danger">*</span></label>
          <input
            name="amount"
            type="number"
            min="0"
            required
            placeholder="0"
            className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {/* 입출금 필드 */}
      {entryType === "cash_flow" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium mb-1">유형 <span className="text-danger">*</span></label>
            <select
              name="flowType"
              required
              className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="deposit">입금</option>
              <option value="withdrawal">출금</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">금액 (원) <span className="text-danger">*</span></label>
            <input
              name="amount"
              type="number"
              min="1"
              required
              placeholder="100000"
              className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">메모</label>
            <input
              name="memo"
              type="text"
              placeholder="월 적립금"
              className="w-full rounded-lg border border-surface-dim px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
