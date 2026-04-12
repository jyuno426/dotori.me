"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card";
import { useLoading } from "@/components/ui/loading-overlay";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[] | null>(null);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    showLoading();
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then(setPortfolios)
      .finally(() => hideLoading());
  }, [showLoading, hideLoading]);

  if (!portfolios) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">포트폴리오</h1>
        <Link
          href="/portfolios/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={14} />
          새 포트폴리오
        </Link>
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-16 text-foreground/60">
          <p>아직 포트폴리오가 없습니다.</p>
          <p className="text-sm mt-1">위 버튼을 눌러 첫 포트폴리오를 만들어보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map((pf) => (
            <PortfolioSummaryCard key={pf.id} portfolio={pf} />
          ))}
        </div>
      )}
    </div>
  );
}
