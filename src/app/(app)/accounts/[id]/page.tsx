"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, ArrowLeft, Wallet, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SnapshotEntryForm } from "@/components/portfolio/snapshot-entry-form";
import { AccountTimeline } from "@/components/portfolio/account-timeline";
import { formatKRW } from "@/lib/utils";
import { useLoading } from "@/components/ui/loading-overlay";
import {
  Button,
  EmptyState,
  Heading,
  Pill,
  Stack,
  Text,
} from "@/components/ds";

interface AccountDetail {
  id: string;
  name: string;
  broker: string | null;
  accountType: string;
  portfolioId: string;
  portfolioName: string;
}

interface Instrument {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  assetClass: string;
}

interface TargetAllocation {
  ticker: string;
  name: string;
  targetPercent: number;
}

interface Snapshot {
  id: string;
  accountId: string;
  date: string;
  holdings: string;
  cash: number;
  cashFlows: string | null;
  memo: string | null;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  irp: "IRP",
  pension: "연금저축",
  isa: "ISA",
  brokerage: "일반 위탁",
  cma: "CMA",
};

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<Snapshot | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [latestCash, setLatestCash] = useState<number | null>(null);

  useEffect(() => {
    showLoading();
    fetch(`/api/accounts/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AccountDetail) => {
        setAccount(data);
        return Promise.all([
          fetch(`/api/instruments?portfolioId=${data.portfolioId}`).then((r) => r.json()),
          fetch(`/api/target-allocations?portfolioId=${data.portfolioId}`).then((r) => r.json()),
        ]);
      })
      .then(([insts, allocs]) => {
        setInstruments(insts);
        setTargetAllocations(allocs);
      })
      .catch(() => setError("계좌 정보를 불러오는데 실패했습니다."))
      .finally(() => hideLoading());
  }, [params.id, showLoading, hideLoading]);

  useEffect(() => {
    fetch(`/api/account-entries?accountId=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Snapshot[]) => {
        if (data.length > 0) setLatestCash(data[0].cash);
      })
      .catch(() => {});
  }, [params.id, refreshKey]);

  function handleEdit(snapshot: Snapshot) {
    setEditSnapshot(snapshot);
  }

  if (error) {
    return (
      <EmptyState
        size="lg"
        title={<Text size="body-sm" tone="danger">{error}</Text>}
        action={
          <Button href="/portfolios" variant="primary" size="sm">
            포트폴리오 목록으로
          </Button>
        }
      />
    );
  }

  if (!account) return null;

  async function handleDeleteAccount() {
    if (!confirm("이 계좌를 삭제하시겠습니까? 모든 기록이 함께 삭제됩니다.")) return;
    showLoading();
    const res = await fetch(`/api/accounts/${params.id}`, { method: "DELETE" });
    hideLoading();
    if (res.ok) {
      router.push(`/portfolios/${account!.portfolioId}`);
    } else {
      alert("계좌 삭제에 실패했습니다.");
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Link
          href={`/portfolios/${account.portfolioId}`}
          className="inline-flex items-center gap-1 text-body-sm text-foreground-muted hover:text-foreground-strong transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          {account.portfolioName}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Heading as="h1" level="heading-2">
              {account.name}
            </Heading>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Pill tone="primary" size="sm" bordered={false}>
                {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
              </Pill>
              {account.broker && (
                <Text as="span" size="body-sm" tone="muted">
                  {account.broker}
                </Text>
              )}
              {latestCash != null && latestCash > 0 && (
                <Pill
                  tone="muted"
                  size="sm"
                  bordered={false}
                  icon={<Wallet size={10} />}
                >
                  예수금 {formatKRW(latestCash)}
                </Pill>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAccount}
              iconLeft={<Trash2 size={14} />}
              className="border-danger/30 text-danger hover:bg-danger-bg"
            >
              삭제
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSnapshotForm(true)}
              iconLeft={<Plus size={14} />}
            >
              새 기록 추가
            </Button>
          </div>
        </div>
      </div>

      <Stack gap="sm">
        <Heading as="h2" level="title-sm" tone="muted">
          기록 타임라인
        </Heading>
        <AccountTimeline
          accountId={params.id}
          refreshKey={refreshKey}
          onEdit={handleEdit}
        />
      </Stack>

      {showSnapshotForm && (
        <SnapshotEntryForm
          accountId={params.id}
          instruments={instruments}
          targetAllocations={targetAllocations}
          onSaved={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowSnapshotForm(false)}
        />
      )}

      {editSnapshot && (
        <SnapshotEntryForm
          accountId={params.id}
          instruments={instruments}
          targetAllocations={targetAllocations}
          editData={editSnapshot}
          onSaved={() => setRefreshKey((k) => k + 1)}
          onClose={() => setEditSnapshot(null)}
        />
      )}
    </Stack>
  );
}
