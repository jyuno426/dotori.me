"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { AddHoldingForm } from "@/components/portfolio/add-holding-form";

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
  taxType: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  irp: "IRP",
  pension: "연금저축",
  isa: "ISA",
  brokerage: "일반 위탁",
  cma: "CMA",
};

const TAX_TYPE_LABELS: Record<string, string> = {
  tax_deferred: "과세이연",
  tax_free: "비과세",
  separate_tax: "분리과세",
  taxable: "일반과세",
};

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((pfs: Portfolio[]) => {
        const pf = pfs.find((p) => p.id === params.id);
        setPortfolio(pf ?? null);
      })
      .catch(() => setError("포트폴리오 데이터를 불러오는데 실패했습니다."));

    fetch(`/api/accounts?portfolioId=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setAccounts)
      .catch(() => setError("계좌 데이터를 불러오는데 실패했습니다."));
  }, [params.id]);

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

  if (!portfolio) {
    return <div className="animate-pulse text-foreground/60">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{portfolio.name}</h1>
        {portfolio.description && (
          <p className="text-sm text-foreground/60 mt-1">{portfolio.description}</p>
        )}
      </div>

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
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setSelectedAccount(acc.id === selectedAccount ? null : acc.id);
                  setShowAddHolding(false);
                }}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  acc.id === selectedAccount
                    ? "border-primary bg-primary/5"
                    : "border-surface-dim bg-surface hover:border-primary/30"
                }`}
              >
                <p className="font-medium">{acc.name}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60">
                    {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60">
                    {TAX_TYPE_LABELS[acc.taxType] || acc.taxType}
                  </span>
                </div>
                {acc.broker && (
                  <p className="text-xs text-foreground/60 mt-1">{acc.broker}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 보유 종목 */}
      {selectedAccount && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/70">
              보유 종목 — {accounts.find((a) => a.id === selectedAccount)?.name}
            </h2>
            <button
              onClick={() => setShowAddHolding(!showAddHolding)}
              className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
            >
              <Plus size={14} />
              종목 추가
            </button>
          </div>

          {showAddHolding && (
            <AddHoldingForm
              accountId={selectedAccount}
              onAdded={() => {
                setShowAddHolding(false);
                setRefreshKey((k) => k + 1);
              }}
            />
          )}

          <HoldingsTable
            accountId={selectedAccount}
            refreshKey={refreshKey}
          />
        </div>
      )}

      {/* 전체 포트폴리오 보유 종목 */}
      {!selectedAccount && accounts.length > 0 && (
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
