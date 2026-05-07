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
      .then(async ([allocs, returns]: [TargetAllocation[], ReturnData | null]) => {
        const tgts: TargetWeight[] = allocs.map((a) => ({
          ticker: a.ticker,
          name: a.name,
          targetPercent: a.targetPercent,
        }));
        setTargets(tgts);

        let pos: HoldingPosition[] = [];
        const cash = returns?.cashBalance ?? 0;

        if (returns?.holdingDetails && returns.holdingDetails.length > 0) {
          pos = returns.holdingDetails
            .filter((h) => h.price != null && h.price > 0)
            .map((h) => ({
              ticker: h.ticker,
              name: h.name,
              shares: h.shares,
              price: h.price!,
              value: h.value,
            }));
        }

        // 보유 종목이 비어있으면(=신규 포트폴리오) 목표 종목 시세를 조회해서
        // 가상 보유(shares=0, value=0, price=현재가)를 채워 contribute 모드가 작동하게 한다.
        if (pos.length === 0 && tgts.length > 0) {
          try {
            const tickers = tgts
              .map((t) => t.ticker)
              .filter((t) => t && t !== "__CASH__")
              .join(",");
            if (tickers) {
              const priceMap = (await fetch(
                `/api/prices?tickers=${encodeURIComponent(tickers)}`,
              ).then((r) => r.json())) as Record<
                string,
                { close: number; date: string }
              >;
              pos = tgts
                .map((t) => ({
                  ticker: t.ticker,
                  name: t.name,
                  shares: 0,
                  price: priceMap[t.ticker]?.close ?? 0,
                  value: 0,
                }))
                .filter((h) => h.price > 0);
            }
          } catch {
            /* 시세 조회 실패해도 페이지는 계속 동작 */
          }
        }

        setHoldings(pos);
        setCashBalance(cash);
        setDrift(analyzeDrift(pos, tgts, cash));
        setOrders(calculateRebalanceOrders(pos, tgts, cash));
      })
      .finally(() => hideLoading());
  }, [selectedId, showLoading, hideLoading]);

  useEffect(() => {
    const amount = Number(contribution) || 0;
    // 시세를 가진 보유 (실제 또는 phantom) 가 있으면 contribute 모드 작동
    if (amount > 0 && targets.length > 0 && holdings.length > 0) {
      setContributionOrders(
        calculateContributionAllocation(holdings, targets, cashBalance, amount),
      );
    } else {
      setContributionOrders([]);
    }
  }, [contribution, holdings, targets, cashBalance]);

  // 신규 포트폴리오(보유 0 + 시세만 있음)면 자동으로 contribute 모드로
  useEffect(() => {
    if (
      targets.length > 0 &&
      holdings.length > 0 &&
      holdings.every((h) => h.shares === 0)
    ) {
      queueMicrotask(() => setMode("contribute"));
    }
  }, [targets.length, holdings]);

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
  // 보유가 0이어도 시세가 있는 phantom holdings가 있으면 contribute 모드는 가능
  const hasPrices = holdings.some((h) => h.price > 0);
  const isFreshPortfolio = totalValue === 0 && hasPrices;
  const hasData = targets.length > 0 && (totalValue > 0 || hasPrices);
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
          {isFreshPortfolio && (
            <Card tone="primary" padding="md" radius="lg">
              <Text size="body-sm">
                <strong className="text-foreground-strong">
                  새 포트폴리오를 시작하셨네요.
                </strong>{" "}
                아래 *월 적립 배분*에 이번 달 투자 금액을 입력하면, 어느 종목 몇
                주를 살지 바로 알려드려요. 매매를 마친 후 보유 수량을 입력하시면
                전체 리밸런싱도 함께 계산해드릴게요.
              </Text>
            </Card>
          )}

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
