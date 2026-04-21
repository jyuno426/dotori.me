"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase, TrendingUp, PieChart } from "lucide-react";
import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card";
import { formatKRW, formatPercent } from "@/lib/utils";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { useLoading } from "@/components/ui/loading-overlay";
import {
  Button,
  EmptyState,
  Heading,
  PageHeader,
  Stack,
  Stat,
  Text,
} from "@/components/ds";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
}

interface ReturnData {
  totalValue: number;
  profitLoss: number;
  returnRate: number;
}

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[] | null>(null);
  const [totalReturn, setTotalReturn] = useState<ReturnData | null>(null);
  const [error, setError] = useState("");
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    showLoading();
    fetch("/api/portfolios")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((pfs: Portfolio[]) => {
        setPortfolios(pfs);
        if (pfs.length > 0) {
          Promise.all(
            pfs.map((p) =>
              fetch(`/api/returns?portfolioId=${p.id}`)
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            )
          ).then((results) => {
            const valid = results.filter(Boolean) as ReturnData[];
            if (valid.length > 0) {
              const totalValue = valid.reduce((s, r) => s + r.totalValue, 0);
              const profitLoss = valid.reduce((s, r) => s + r.profitLoss, 0);
              const netInvested = totalValue - profitLoss;
              const returnRate = netInvested > 0 ? (profitLoss / netInvested) * 100 : 0;
              setTotalReturn({ totalValue, profitLoss, returnRate });
            }
          });
        }
      })
      .catch(() => setError("데이터를 불러오는데 실패했습니다."))
      .finally(() => hideLoading());
  }, [showLoading, hideLoading]);

  if (!portfolios && !error) return null;

  if (error || !portfolios) {
    return (
      <EmptyState
        size="lg"
        title={<Text size="body-sm" tone="danger">{error}</Text>}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => location.reload()}
          >
            다시 시도
          </Button>
        }
      />
    );
  }

  if (portfolios.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={<AcornIcon className="w-16 h-16" />}
        title="포트폴리오를 만들어보세요"
        description="나만의 포트폴리오를 만들고, 자산 현황을 한눈에 확인하세요."
        action={
          <Button
            href="/portfolios/new"
            variant="primary"
            size="md"
            iconLeft={<Plus size={16} />}
          >
            첫 포트폴리오 만들기
          </Button>
        }
      />
    );
  }

  const hasReturn = totalReturn && totalReturn.totalValue > 0;

  return (
    <Stack gap="lg">
      <PageHeader
        title="대시보드"
        actions={
          <Button
            href="/portfolios/new"
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
          >
            포트폴리오 추가
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          icon={<Briefcase size={16} />}
          label="포트폴리오"
          value={`${portfolios.length}개`}
        />
        <Stat
          icon={<TrendingUp size={16} />}
          label="총 평가액"
          value={hasReturn ? formatKRW(totalReturn.totalValue) : "—"}
          tone={hasReturn ? "default" : "muted"}
          hint={hasReturn ? undefined : "종목·현재가 등록 후 확인 가능"}
        />
        <Stat
          icon={<PieChart size={16} />}
          label="수익률"
          value={hasReturn ? formatPercent(totalReturn.returnRate) : "—"}
          tone={
            hasReturn
              ? totalReturn.profitLoss >= 0
                ? "success"
                : "danger"
              : "muted"
          }
          hint={hasReturn ? undefined : "입출금·현재가 등록 후 확인 가능"}
        />
      </div>

      <Stack gap="sm">
        <Heading as="h2" level="title-sm" tone="muted">
          내 포트폴리오
        </Heading>
        <Stack gap="sm">
          {portfolios.map((pf) => (
            <PortfolioSummaryCard key={pf.id} portfolio={pf} />
          ))}
        </Stack>
      </Stack>

      <AllocationChart portfolioIds={portfolios.map((p) => p.id)} />
    </Stack>
  );
}
