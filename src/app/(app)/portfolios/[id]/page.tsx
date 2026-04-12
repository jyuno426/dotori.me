"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Building2, Wallet, ChevronRight } from "lucide-react";
import Link from "next/link";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { ReturnSummary } from "@/components/portfolio/return-summary";
import { InstrumentManager } from "@/components/portfolio/instrument-manager";
import { DriftChart } from "@/components/portfolio/drift-chart";
import { formatKRW } from "@/lib/utils";
import { useLoading } from "@/components/ui/loading-overlay";

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
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const { showLoading, hideLoading } = useLoading();

  // 계좌별 최신 예수금
  const [cashByAccount, setCashByAccount] = useState<Record<string, number>>({});

  // 포트폴리오 종목 설정
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

  // 예수금 로드
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

  // 종목 설정 로드
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

  if (!portfolio && !error) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{portfolio.name}</h1>
        {portfolio.description && (
          <p className="text-sm text-foreground/60 mt-1">{portfolio.description}</p>
        )}
      </div>

      {/* 수익률 요약 */}
      <ReturnSummary portfolioId={params.id} refreshKey={refreshKey} />

      {/* 계좌 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/70 flex items-center gap-1.5">
            <Building2 size={14} />
            계좌 ({accounts.length}개)
          </h2>
          <Link
            href={`/accounts/new?portfolioId=${params.id}`}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
          >
            <Plus size={14} />
            계좌 추가
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
            아직 계좌가 없습니다. 계좌를 추가해주세요.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((acc) => {
              const balance = cashByAccount[acc.id] ?? null;
              return (
                <Link
                  key={acc.id}
                  href={`/accounts/${acc.id}`}
                  className="text-left rounded-xl border border-surface-dim bg-surface p-4 transition-colors hover:border-primary/30 group"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{acc.name}</p>
                    <div className="flex items-center gap-2">
                      {balance != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                          <Wallet size={10} />
                          {formatKRW(balance)}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-foreground/30 group-hover:text-foreground/60 transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60">
                      {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                    </span>
                  </div>
                  {acc.broker && (
                    <p className="text-xs text-foreground/60 mt-1">{acc.broker}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 종목 설정 — 계좌 없이도 항상 표시 */}
      <InstrumentManager
        portfolioId={params.id}
        instruments={instruments}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />

      {/* 드리프트 차트 */}
      <DriftChart portfolioId={params.id} refreshKey={refreshKey} />

      {/* 전체 보유 종목 — 계좌가 있을 때만 */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground/70">
            전체 보유 종목
          </h2>
          <HoldingsTable
            portfolioId={params.id}
            refreshKey={refreshKey}
          />
        </div>
      )}
    </div>
  );
}
