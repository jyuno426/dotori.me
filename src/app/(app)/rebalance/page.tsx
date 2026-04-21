"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, ArrowDown, ArrowUp, Minus, DollarSign } from "lucide-react";
import { useLoading } from "@/components/ui/loading-overlay";
import { formatKRW } from "@/lib/utils";
import {
  analyzeDrift,
  calculateRebalanceOrders,
  calculateContributionAllocation,
  type HoldingPosition,
  type TargetWeight,
  type DriftItem,
  type TradeOrder,
} from "@/lib/rebalance";
import {
  Card,
  EmptyState,
  FormField,
  Heading,
  Input,
  PageHeader,
  Select,
  Stack,
  Text,
} from "@/components/ds";
import { cn } from "@/lib/cn";

interface Portfolio {
  id: string;
  name: string;
}

interface TargetAllocation {
  ticker: string;
  name: string;
  targetPercent: number;
}

interface ReturnData {
  totalValue: number;
  cashBalance: number;
  holdingDetails: { ticker: string; name: string; shares: number; price: number | null; value: number }[];
}

export default function RebalancePage() {
  const { showLoading, hideLoading } = useLoading();
  const [portfolios, setPortfolios] = useState<Portfolio[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [holdings, setHoldings] = useState<HoldingPosition[]>([]);
  const [targets, setTargets] = useState<TargetWeight[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [drift, setDrift] = useState<DriftItem[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);

  const [mode, setMode] = useState<"rebalance" | "contribute">("rebalance");
  const [contribution, setContribution] = useState("");
  const [contributionOrders, setContributionOrders] = useState<TradeOrder[]>([]);

  useEffect(() => {
    showLoading();
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then((pfs: Portfolio[]) => {
        setPortfolios(pfs);
        if (pfs.length === 1) setSelectedId(pfs[0].id);
      })
      .finally(() => hideLoading());
  }, [showLoading, hideLoading]);

  useEffect(() => {
    if (!selectedId) return;
    showLoading();

    Promise.all([
      fetch(`/api/target-allocations?portfolioId=${selectedId}`).then((r) => r.json()),
      fetch(`/api/returns?portfolioId=${selectedId}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([allocs, returns]: [TargetAllocation[], ReturnData | null]) => {
        const tgts: TargetWeight[] = allocs.map((a) => ({
          ticker: a.ticker,
          name: a.name,
          targetPercent: a.targetPercent,
        }));
        setTargets(tgts);

        if (returns?.holdingDetails) {
          const pos: HoldingPosition[] = returns.holdingDetails
            .filter((h) => h.price != null && h.price > 0)
            .map((h) => ({
              ticker: h.ticker,
              name: h.name,
              shares: h.shares,
              price: h.price!,
              value: h.value,
            }));
          setHoldings(pos);
          setCashBalance(returns.cashBalance ?? 0);

          setDrift(analyzeDrift(pos, tgts, returns.cashBalance ?? 0));
          setOrders(calculateRebalanceOrders(pos, tgts, returns.cashBalance ?? 0));
        }
      })
      .finally(() => hideLoading());
  }, [selectedId, showLoading, hideLoading]);

  useEffect(() => {
    const amount = Number(contribution) || 0;
    if (amount > 0 && holdings.length > 0 && targets.length > 0) {
      setContributionOrders(
        calculateContributionAllocation(holdings, targets, cashBalance, amount),
      );
    } else {
      setContributionOrders([]);
    }
  }, [contribution, holdings, targets, cashBalance]);

  if (!portfolios) return null;

  if (portfolios.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={<ArrowRightLeft size={48} />}
        title="리밸런싱"
        description="포트폴리오를 먼저 만들고 종목과 목표 비중을 설정해주세요."
      />
    );
  }

  const totalValue = holdings.reduce((s, h) => s + h.value, 0) + cashBalance;
  const hasData = targets.length > 0 && totalValue > 0;
  const activeOrders = mode === "contribute" ? contributionOrders : orders;
  const totalTradeAmount = activeOrders.reduce((s, o) => s + o.amount, 0);

  return (
    <Stack gap="lg">
      <PageHeader title="리밸런싱" />

      {portfolios.length > 1 && (
        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">포트폴리오 선택</option>
          {portfolios.map((pf) => (
            <option key={pf.id} value={pf.id}>
              {pf.name}
            </option>
          ))}
        </Select>
      )}

      {selectedId && !hasData && (
        <EmptyState
          title="리밸런싱 계산에 필요한 데이터가 부족해요"
          description="종목, 목표 비중, 현재가를 포트폴리오 상세 페이지에서 설정해주세요."
        />
      )}

      {selectedId && hasData && (
        <>
          <div className="flex gap-2">
            <ModeButton
              active={mode === "rebalance"}
              onClick={() => setMode("rebalance")}
            >
              전체 리밸런싱
            </ModeButton>
            <ModeButton
              active={mode === "contribute"}
              onClick={() => setMode("contribute")}
            >
              월 적립 배분
            </ModeButton>
          </div>

          {mode === "contribute" && (
            <Card padding="md" radius="lg">
              <FormField
                label={
                  <span className="inline-flex items-center gap-1">
                    <DollarSign size={14} />
                    이번 달 적립금
                  </span>
                }
                htmlFor="contribution"
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="contribution"
                    type="number"
                    min="0"
                    step="10000"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    placeholder="500000"
                    className="text-right"
                    nums
                  />
                  <Text as="span" size="body-sm" tone="muted">
                    원
                  </Text>
                </div>
              </FormField>
            </Card>
          )}

          {mode === "rebalance" && drift.length > 0 && (
            <Card padding="md" radius="lg">
              <Stack gap="sm">
                <Heading as="h2" level="title-sm" tone="muted">
                  드리프트 분석
                </Heading>
                <Stack gap="sm">
                  {drift.map((d) => {
                    const overweight = d.drift > 0;
                    const significant = Math.abs(d.drift) >= 3;
                    return (
                      <div key={d.ticker} className="flex items-center gap-3">
                        <div className="w-28 sm:w-36 shrink-0 truncate">
                          <Text as="span" size="label">{d.name}</Text>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-caption mb-1">
                            <Text as="span" size="caption" tone="subtle">
                              목표 {d.targetPercent}%
                            </Text>
                            <span
                              className={cn(
                                "nums",
                                significant
                                  ? overweight
                                    ? "text-danger"
                                    : "text-primary"
                                  : "text-foreground-subtle",
                              )}
                            >
                              현재 {d.currentPercent}% ({d.drift > 0 ? "+" : ""}
                              {d.drift}%)
                            </span>
                          </div>
                          <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-[var(--duration-base)]",
                                significant
                                  ? overweight
                                    ? "bg-danger"
                                    : "bg-primary"
                                  : "bg-primary/50",
                              )}
                              style={{ width: `${Math.min(d.currentPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Stack>
              </Stack>
            </Card>
          )}

          {activeOrders.length > 0 && (
            <Card padding="md" radius="lg">
              <Stack gap="sm">
                <Heading as="h2" level="title-sm" tone="muted">
                  {mode === "contribute" ? "적립 매수 지시서" : "매매 지시서"}
                </Heading>

                <Stack gap="sm">
                  {activeOrders.map((o) => (
                    <div
                      key={o.ticker}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border"
                    >
                      <div className="shrink-0">
                        {o.action === "buy" ? (
                          <ArrowDown size={16} className="text-success" />
                        ) : o.action === "sell" ? (
                          <ArrowUp size={16} className="text-danger" />
                        ) : (
                          <Minus size={16} className="text-foreground-subtle" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text as="span" size="label">
                          {o.name}
                        </Text>
                        <span className="text-caption text-foreground-subtle font-mono ml-1">
                          {o.ticker}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        {o.action !== "hold" ? (
                          <>
                            <span
                              className={cn(
                                "text-label",
                                o.action === "buy"
                                  ? "text-success"
                                  : "text-danger",
                              )}
                            >
                              {o.action === "buy" ? "매수" : "매도"} {o.shares}주
                            </span>
                            <Text size="caption" tone="subtle" nums>
                              {formatKRW(o.amount)}
                            </Text>
                          </>
                        ) : (
                          <Text as="span" size="label" tone="subtle">
                            유지
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </Stack>

                {totalTradeAmount > 0 && (
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Text size="body-sm" tone="muted">
                      총 매매 금액
                    </Text>
                    <span className="text-title nums">
                      {formatKRW(totalTradeAmount)}
                    </span>
                  </div>
                )}
              </Stack>
            </Card>
          )}

          {activeOrders.length === 0 &&
            mode === "contribute" &&
            Number(contribution) > 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Text size="body-sm" tone="muted">
                  현재가 데이터가 부족하여 배분을 계산할 수 없습니다.
                </Text>
              </div>
            )}

          <Card padding="md" radius="lg">
            <Stack gap="sm">
              <Heading as="h2" level="title-sm" tone="muted">
                포트폴리오 요약
              </Heading>
              <div className="grid grid-cols-2 gap-4">
                <SummaryItem label="총 평가액" value={formatKRW(totalValue)} />
                <SummaryItem label="예수금" value={formatKRW(cashBalance)} />
                <SummaryItem label="종목 수" value={`${holdings.length}개`} />
                <SummaryItem
                  label="목표 비중 설정"
                  value={`${targets.length}개`}
                />
              </div>
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg py-2.5 text-label font-medium transition-colors duration-[var(--duration-fast)]",
        active
          ? "bg-primary text-white"
          : "border border-border text-foreground-muted hover:bg-surface-muted",
      )}
    >
      {children}
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="caption" tone="subtle">
        {label}
      </Text>
      <p className="text-title nums text-foreground-strong">{value}</p>
    </div>
  );
}
