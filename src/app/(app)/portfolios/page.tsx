"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase } from "lucide-react";
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card";
import { useLoading } from "@/components/ui/loading-overlay";
import {
  Button,
  EmptyState,
  PageHeader,
  Stack,
} from "@/components/ds";

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
    <Stack gap="lg">
      <PageHeader
        title="포트폴리오"
        actions={
          <Button
            href="/portfolios/new"
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
          >
            새 포트폴리오
          </Button>
        }
      />

      {portfolios.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={40} />}
          title="아직 포트폴리오가 없습니다"
          description="위 버튼을 눌러 첫 포트폴리오를 만들어보세요."
        />
      ) : (
        <Stack gap="sm">
          {portfolios.map((pf) => (
            <PortfolioSummaryCard key={pf.id} portfolio={pf} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
