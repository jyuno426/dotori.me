"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Building2, Wallet, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { ReturnSummary } from "@/components/portfolio/return-summary";
import { InstrumentManager } from "@/components/portfolio/instrument-manager";
import { DriftChart } from "@/components/portfolio/drift-chart";
import { formatKRW } from "@/lib/utils";
import { useLoading } from "@/components/ui/loading-overlay";
import {
  Button,
  DangerZone,
  EmptyState,
  Heading,
  Pill,
  Stack,
  Text,
} from "@/components/ds";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
}

interface Account {
  id: string;
  name: string;
  broker: string | null;
  accountType: string;
}

interface Snapshot {
  id: string;
  accountId: string;
  date: string;
  cash: number;
}

interface Instrument {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  assetClass: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  irp: "IRP",
  pension: "연금저축",
  isa: "ISA",
  brokerage: "일반 위탁",
  cma: "CMA",
};

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const { showLoading, hideLoading } = useLoading();

  const [cashByAccount, setCashByAccount] = useState<Record<string, number>>({});
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    showLoading();
    Promise.all([
      fetch("/api/portfolios").then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }).then((pfs: Portfolio[]) => {
        const pf = pfs.find((p) => p.id === params.id);
        setPortfolio(pf ?? null);
      }),
      fetch(`/api/accounts?portfolioId=${params.id}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }).then(setAccounts),
    ])
      .catch(() => setError("데이터를 불러오는데 실패했습니다."))
      .finally(() => hideLoading());
  }, [params.id, showLoading, hideLoading]);

  useEffect(() => {
    fetch(`/api/account-entries?portfolioId=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: (Snapshot & { accountName?: string })[]) => {
        const latestCash: Record<string, number> = {};
        const latestDate: Record<string, string> = {};
        for (const snap of data) {
          if (!latestDate[snap.accountId] || snap.date > latestDate[snap.accountId]) {
            latestDate[snap.accountId] = snap.date;
            latestCash[snap.accountId] = snap.cash;
          }
        }
        setCashByAccount(latestCash);
      })
      .catch(() => {});
  }, [params.id, refreshKey]);

  useEffect(() => {
    fetch(`/api/instruments?portfolioId=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setInstruments)
      .catch(() => {});
  }, [params.id, refreshKey]);

  if (error) {
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

  if (!portfolio) return null;

  async function handleDeletePortfolio() {
    if (!portfolio) return;
    const accountCount = accounts.length;
    const confirmMsg =
      accountCount > 0
        ? `"${portfolio.name}" 포트폴리오를 삭제하시겠습니까?\n연결된 계좌 ${accountCount}개와 모든 기록·종목·목표비중이 함께 삭제됩니다.\n되돌릴 수 없습니다.`
        : `"${portfolio.name}" 포트폴리오를 삭제하시겠습니까?\n되돌릴 수 없습니다.`;
    if (!confirm(confirmMsg)) return;

    showLoading();
    const res = await fetch(`/api/portfolios/${params.id}`, {
      method: "DELETE",
    });
    hideLoading();
    if (res.ok) {
      router.push("/portfolios");
      router.refresh();
    } else {
      alert("포트폴리오 삭제에 실패했습니다.");
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Heading as="h1" level="heading-2">
          {portfolio.name}
        </Heading>
        {portfolio.description && (
          <Text size="body-sm" tone="muted" className="mt-1">
            {portfolio.description}
          </Text>
        )}
      </div>

      <ReturnSummary portfolioId={params.id} refreshKey={refreshKey} />

      <Stack gap="sm">
        <div className="flex items-center justify-between">
          <Heading as="h2" level="title-sm" tone="muted" className="flex items-center gap-1.5">
            <Building2 size={14} />
            계좌 ({accounts.length}개)
          </Heading>
          <Link
            href={`/accounts/new?portfolioId=${params.id}`}
            className="flex items-center gap-1 text-label text-primary font-medium hover:underline"
          >
            <Plus size={14} />
            계좌 추가
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Text size="body-sm" tone="muted">
              아직 계좌가 없습니다. 계좌를 추가해주세요.
            </Text>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((acc) => {
              const balance = cashByAccount[acc.id] ?? null;
              return (
                <Link
                  key={acc.id}
                  href={`/accounts/${acc.id}`}
                  className="group rounded-xl border border-border bg-surface p-4 transition-colors duration-[var(--duration-fast)] hover:border-primary-200"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-title text-foreground-strong">{acc.name}</p>
                    <div className="flex items-center gap-2">
                      {balance != null && (
                        <Pill
                          tone="primary"
                          size="sm"
                          bordered={false}
                          icon={<Wallet size={10} />}
                        >
                          {formatKRW(balance)}
                        </Pill>
                      )}
                      <ChevronRight
                        size={16}
                        className="text-foreground-subtle group-hover:text-foreground-muted transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Pill tone="muted" size="sm" bordered={false}>
                      {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                    </Pill>
                  </div>
                  {acc.broker && (
                    <Text size="caption" tone="muted" className="mt-1">
                      {acc.broker}
                    </Text>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Stack>

      <InstrumentManager
        portfolioId={params.id}
        instruments={instruments}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />

      <DriftChart portfolioId={params.id} refreshKey={refreshKey} />

      {accounts.length > 0 && (
        <Stack gap="sm">
          <Heading as="h2" level="title-sm" tone="muted">
            전체 보유 종목
          </Heading>
          <HoldingsTable portfolioId={params.id} refreshKey={refreshKey} />
        </Stack>
      )}

      <DangerZone
        title="포트폴리오 삭제"
        description={
          accounts.length > 0
            ? `연결된 계좌 ${accounts.length}개와 모든 기록·종목·목표비중이 함께 삭제됩니다. 되돌릴 수 없어요.`
            : "한번 삭제하면 되돌릴 수 없어요."
        }
        action={
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeletePortfolio}
            iconLeft={<Trash2 size={14} />}
          >
            포트폴리오 삭제
          </Button>
        }
      />
    </Stack>
  );
}
