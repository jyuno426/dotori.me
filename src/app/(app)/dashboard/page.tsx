"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";
import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setPortfolios)
      .catch(() => setError("데이터를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={() => location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-6xl" role="img" aria-label="도토리">🌰</div>
        <h1 className="text-xl font-semibold">포트폴리오를 만들어보세요</h1>
        <p className="text-foreground/60 text-sm text-center max-w-sm">
          다계좌를 하나의 포트폴리오로 통합하여 비중 분석과 리밸런싱을 시작하세요.
        </p>
        <Link
          href="/portfolios/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} />
          첫 포트폴리오 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">대시보드</h1>
        <Link
          href="/portfolios/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={14} />
          포트폴리오 추가
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-surface-dim bg-surface p-5">
          <div className="flex items-center gap-2 text-foreground/60 text-sm">
            <Briefcase size={16} />
            포트폴리오
          </div>
          <p className="mt-2 text-2xl font-bold">{portfolios.length}개</p>
        </div>
        <div className="rounded-xl border border-surface-dim bg-surface p-5">
          <div className="flex items-center gap-2 text-foreground/60 text-sm">
            <TrendingUp size={16} />
            총 평가액
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground/50">—</p>
          <p className="text-xs text-foreground/50 mt-1">종목 등록 후 확인 가능</p>
        </div>
        <div className="rounded-xl border border-surface-dim bg-surface p-5">
          <div className="flex items-center gap-2 text-foreground/60 text-sm">
            <PieChart size={16} />
            자산배분
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground/50">—</p>
          <p className="text-xs text-foreground/50 mt-1">종목 등록 후 확인 가능</p>
        </div>
      </div>

      {/* 포트폴리오 목록 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground/70">내 포트폴리오</h2>
        {portfolios.map((pf) => (
          <PortfolioSummaryCard key={pf.id} portfolio={pf} />
        ))}
      </div>

      {/* 자산 배분 차트 (전체 포트폴리오 통합) */}
      <AllocationChart portfolioIds={portfolios.map((p) => p.id)} />
    </div>
  );
}
