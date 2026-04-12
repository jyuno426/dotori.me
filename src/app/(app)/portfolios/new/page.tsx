"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPortfolioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/portfolios/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "포트폴리오 생성에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-bold">새 포트폴리오</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이름 <span className="text-danger">*</span></label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="내 자산배분 포트폴리오"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">설명 (선택)</label>
          <input
            name="description"
            className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="주식 60% / 채권 40% 자산배분"
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
            {loading ? "생성 중..." : "생성"}
          </button>
        </div>
      </form>
    </div>
  );
}
