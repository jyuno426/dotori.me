"use client";

import { useEffect, useState } from "react";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  broker: string | null;
  accountType: string;
  taxType: string;
  portfolioName?: string;
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">계좌 관리</h1>
        <Link
          href="/accounts/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={14} />
          새 계좌
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-foreground/60">
          <Building2 size={40} className="mx-auto mb-3 text-foreground/60" />
          <p>등록된 계좌가 없습니다.</p>
          <p className="text-sm mt-1">먼저 포트폴리오를 만들고 계좌를 추가해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-surface-dim bg-surface p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{acc.name}</p>
                  {acc.broker && (
                    <p className="text-xs text-foreground/60 mt-0.5">{acc.broker}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60">
                  {TAX_TYPE_LABELS[acc.taxType] || acc.taxType}
                </span>
              </div>
              {acc.portfolioName && (
                <p className="text-xs text-foreground/60 mt-2">
                  포트폴리오: {acc.portfolioName}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
