"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLoading } from "@/components/ui/loading-overlay";
import {
  Button,
  EmptyState,
  PageHeader,
  Pill,
  Stack,
  Text,
} from "@/components/ds";

interface Account {
  id: string;
  name: string;
  broker: string | null;
  accountType: string;
  portfolioName?: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  irp: "IRP",
  pension: "연금저축",
  isa: "ISA",
  brokerage: "일반 위탁",
  cma: "CMA",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    showLoading();
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts)
      .finally(() => hideLoading());
  }, [showLoading, hideLoading]);

  if (!accounts) return null;

  return (
    <Stack gap="lg">
      <PageHeader
        title="계좌 관리"
        actions={
          <Button
            href="/accounts/new"
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
          >
            새 계좌
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} />}
          title="등록된 계좌가 없습니다"
          description="먼저 포트폴리오를 만들고 계좌를 추가해주세요."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Link
              key={acc.id}
              href={`/accounts/${acc.id}`}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors duration-[var(--duration-fast)] hover:border-primary-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-title-lg text-foreground-strong">
                    {acc.name}
                  </p>
                  {acc.broker && (
                    <Text size="caption" tone="muted" className="mt-0.5">
                      {acc.broker}
                    </Text>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className="text-foreground-subtle group-hover:text-foreground-muted transition-colors mt-1"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Pill tone="primary" size="sm" bordered={false}>
                  {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                </Pill>
              </div>
              {acc.portfolioName && (
                <Text size="caption" tone="muted" className="mt-2">
                  포트폴리오: {acc.portfolioName}
                </Text>
              )}
            </Link>
          ))}
        </div>
      )}
    </Stack>
  );
}
