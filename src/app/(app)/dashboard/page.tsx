"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Briefcase,
  TrendingUp,
  PieChart,
  ArrowRight,
} from "lucide-react";
import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card";
import { formatKRW, formatPercent } from "@/lib/utils";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { useLoading } from "@/components/ui/loading-overlay";
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
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
        title="첫 도토리 보관소를 만들어볼까요"
        description="자산배분 진단을 받으면 포트폴리오·종목·계좌까지 한 번에 셋업해드려요. 1분이면 끝나요."
        action={
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              href="/tools/portfolio-quiz"
              variant="primary"
              size="md"
              iconRight={<ArrowRight size={16} />}
            >
              진단부터 시작하기
            </Button>
            <Button
              href="/portfolios/new"
              variant="ghost"
              size="md"
              iconLeft={<Plus size={16} />}
            >
              직접 만들기
            </Button>
          </div>
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

      <ThisMonthCard hasReturn={!!hasReturn} />

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

function ThisMonthCard({ hasReturn }: { hasReturn: boolean }) {
  return (
    <Card tone="primary" padding="lg" radius="xl">
      <div className="flex items-start gap-5">
        <div className="hidden sm:block shrink-0 mt-1">
          <AcornIcon className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <Eyebrow tone="primary">이번 달 한 걸음</Eyebrow>
          {hasReturn ? (
            <>
              <Heading as="h2" level="title-lg" className="mt-2">
                월급일이 다가왔다면, 5분만요
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-2">
                이번 달 적립금을 입력하시면 *어느 종목 몇 주*까지 정리해드려요.
                매매 후 보유 수량만 적어두시면 다음 달부터 더 정확해져요.
              </Text>
            </>
          ) : (
            <>
              <Heading as="h2" level="title-lg" className="mt-2">
                첫 매매 지시서를 받아볼까요
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-2">
                자산배분과 계좌는 이미 셋업돼 있어요. 이번 달 투입할 금액만
                입력하시면 *몇 종목 몇 주*까지 바로 보여드려요.
              </Text>
            </>
          )}
          <div className="mt-4">
            <Button
              href="/rebalance"
              variant="primary"
              size="md"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              매매 지시서 받기
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
