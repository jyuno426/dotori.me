"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Text } from "@/components/ds";

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
      className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 hover:border-primary-200 transition-colors duration-[var(--duration-fast)]"
    >
      <div>
        <h4 className="text-title-lg text-foreground-strong">{portfolio.name}</h4>
        {portfolio.description && (
          <Text size="body-sm" tone="muted" className="mt-0.5">
            {portfolio.description}
          </Text>
        )}
      </div>
      <ChevronRight size={18} className="text-foreground-subtle" />
    </Link>
  );
}
