"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { SnapshotEntryForm } from "@/components/portfolio/snapshot-entry-form";
import { AccountTimeline } from "@/components/portfolio/account-timeline";
import { formatKRW } from "@/lib/utils";

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
  date: string;
  cash: number;
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
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  // 최신 예수금
  const [latestCash, setLatestCash] = useState<number | null>(null);

  // 계좌 정보 로드
  useEffect(() => {
    fetch(`/api/accounts/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AccountDetail) => {
        setAccount(data);
        // 포트폴리오의 종목/비중 로드
        return Promise.all([
          fetch(`/api/instruments?portfolioId=${data.portfolioId}`).then((r) => r.json()),
          fetch(`/api/target-allocations?portfolioId=${data.portfolioId}`).then((r) => r.json()),
        ]);
      })
      .then(([insts, allocs]) => {
        setInstruments(insts);
        setTargetAllocations(allocs);
      })
      .catch(() => setError("계좌 정보를 불러오는데 실패했습니다."));
  }, [params.id]);

  // 최신 예수금 로드
  useEffect(() => {
    fetch(`/api/account-entries?accountId=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Snapshot[]) => {
        if (data.length > 0) {
          // 최신 날짜순으로 정렬되어 있음
          setLatestCash(data[0].cash);
        }
      })
      .catch(() => {});
  }, [params.id, refreshKey]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-danger text-sm">{error}</p>
        <Link
          href="/portfolios"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          포트폴리오 목록으로
        </Link>
      </div>
    );
  }

  if (!account) {
    return <div className="animate-pulse text-foreground/60">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Link
          href={`/portfolios/${account.portfolioId}`}
          className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          {account.portfolioName}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{account.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
              </span>
              {account.broker && (
                <span className="text-sm text-foreground/60">{account.broker}</span>
              )}
              {latestCash != null && latestCash > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-dim text-foreground/60 flex items-center gap-1">
                  <Wallet size={10} />
                  예수금 {formatKRW(latestCash)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSnapshotForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} />
            새 기록 추가
          </button>
        </div>
      </div>

      {/* 기록 타임라인 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground/70">기록 타임라인</h2>
        <AccountTimeline accountId={params.id} refreshKey={refreshKey} />
      </div>

      {/* 스냅샷 모달 */}
      {showSnapshotForm && (
        <SnapshotEntryForm
          accountId={params.id}
          instruments={instruments}
          targetAllocations={targetAllocations}
          onSaved={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowSnapshotForm(false)}
        />
      )}
    </div>
  );
}
