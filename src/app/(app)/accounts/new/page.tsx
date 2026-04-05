"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Portfolio {
  id: string;
  name: string;
}

export default function NewAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultPortfolioId = searchParams.get("portfolioId") ?? "";

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then((pfs: Portfolio[]) => {
        setPortfolios(pfs);
        if (defaultPortfolioId && pfs.some((p) => p.id === defaultPortfolioId)) {
          setSelectedPortfolioId(defaultPortfolioId);
        }
      });
  }, [defaultPortfolioId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolioId: form.get("portfolioId"),
        name: form.get("name"),
        broker: form.get("broker") || null,
        accountType: form.get("accountType"),
        taxType: form.get("taxType"),
        owner: form.get("owner") || null,
      }),
    });

    if (res.ok) {
      router.push(`/portfolios/${selectedPortfolioId}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "계좌 생성에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">새 계좌 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">포트폴리오 <span className="text-danger">*</span></label>
          <select
            name="portfolioId"
            required
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">선택해주세요</option>
            {portfolios.map((pf) => (
              <option key={pf.id} value={pf.id}>
                {pf.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">계좌 별칭 <span className="text-danger">*</span></label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="예: 삼성 IRP, 키움 위탁"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">증권사 (선택)</label>
          <input
            name="broker"
            className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="예: 삼성증권, 키움증권"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">계좌 유형 <span className="text-danger">*</span></label>
            <select
              name="accountType"
              required
              className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="irp">IRP</option>
              <option value="pension">연금저축</option>
              <option value="isa">ISA</option>
              <option value="brokerage">일반 위탁</option>
              <option value="cma">CMA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">세금 유형 <span className="text-danger">*</span></label>
            <select
              name="taxType"
              required
              className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="tax_deferred">과세이연 (IRP/연금저축)</option>
              <option value="tax_free">비과세 (ISA)</option>
              <option value="separate_tax">분리과세</option>
              <option value="taxable">일반과세</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">소유자 (선택)</label>
          <input
            name="owner"
            className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="예: 본인, 배우자"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-surface-dim py-2.5 text-sm font-medium hover:bg-surface-dim transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
