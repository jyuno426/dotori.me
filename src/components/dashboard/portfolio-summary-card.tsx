"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  portfolio: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function PortfolioSummaryCard({ portfolio }: Props) {
  return (
    <Link
      href={`/portfolios/${portfolio.id}`}
      className="flex items-center justify-between rounded-xl border border-surface-dim bg-surface p-5 hover:border-primary/30 transition-colors"
    >
      <div>
        <h4 className="font-semibold">{portfolio.name}</h4>
        {portfolio.description && (
          <p className="text-sm text-foreground/60 mt-0.5">{portfolio.description}</p>
        )}
      </div>
      <ChevronRight size={18} className="text-foreground/50" />
    </Link>
  );
}
