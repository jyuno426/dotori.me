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

interface Portfolio {
  id: string;
  name: string;
}

interface Instrument {
  ticker: string;
  name: string;
  assetClass: string;
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

  // 월 적립 모드
  const [mode, setMode] = useState<"rebalance" | "contribute">("rebalance");
  const [contribution, setContribution] = useState("");
  const [contributionOrders, setContributionOrders] = useState<TradeOrder[]>([]);

  // 포트폴리오 목록 로드
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

  // 선택된 포트폴리오 데이터 로드
  useEffect(() => {
    if (!selectedId) return;
    showLoading();

    Promise.all([
      fetch(`/api/target-allocations?portfolioId=${selectedId}`).then((r) => r.json()),
      fetch(`/api/returns?portfolioId=${selectedId}`).then((r) => r.ok ? r.json() : null),
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

          // 드리프트 분석
          const d = analyzeDrift(pos, tgts, returns.cashBalance ?? 0);
          setDrift(d);

          // 리밸런싱 주문 계산
          const o = calculateRebalanceOrders(pos, tgts, returns.cashBalance ?? 0);
          setOrders(o);
        }
      })
      .finally(() => hideLoading());
  }, [selectedId, showLoading, hideLoading]);

  // 월 적립 계산
  useEffect(() => {
    const amount = Number(contribution) || 0;
    if (amount > 0 && holdings.length > 0 && targets.length > 0) {
      const co = calculateContributionAllocation(holdings, targets, cashBalance, amount);
      setContributionOrders(co);
    } else {
      setContributionOrders([]);
    }
  }, [contribution, holdings, targets, cashBalance]);

  if (!portfolios) return null;

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ArrowRightLeft size={48} className="text-foreground/30" />
        <h1 className="text-xl font-semibold">리밸런싱</h1>
        <p className="text-foreground/60 text-sm text-center max-w-sm">
          포트폴리오를 먼저 만들고 종목과 목표 비중을 설정해주세요.
        </p>
      </div>
    );
  }

  const totalValue = holdings.reduce((s, h) => s + h.value, 0) + cashBalance;
  const hasData = targets.length > 0 && totalValue > 0;
  const activeOrders = mode === "contribute" ? contributionOrders : orders;
  const totalTradeAmount = activeOrders.reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">리밸런싱</h1>
      </div>

      {/* 포트폴리오 선택 */}
      {portfolios.length > 1 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">포트폴리오 선택</option>
          {portfolios.map((pf) => (
            <option key={pf.id} value={pf.id}>{pf.name}</option>
          ))}
        </select>
      )}

      {selectedId && !hasData && (
        <div className="text-center py-16 text-foreground/60 text-sm">
          <p>종목, 목표 비중, 현재가 데이터가 모두 있어야 리밸런싱 계산이 가능합니다.</p>
          <p className="mt-1">포트폴리오 상세 페이지에서 설정해주세요.</p>
        </div>
      )}

      {selectedId && hasData && (
        <>
          {/* 모드 전환 */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("rebalance")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "rebalance"
                  ? "bg-primary text-white"
                  : "border border-surface-dim text-foreground/60 hover:bg-surface-dim"
              }`}
            >
              전체 리밸런싱
            </button>
            <button
              onClick={() => setMode("contribute")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "contribute"
                  ? "bg-primary text-white"
                  : "border border-surface-dim text-foreground/60 hover:bg-surface-dim"
              }`}
            >
              월 적립 배분
            </button>
          </div>

          {/* 월 적립금 입력 */}
          {mode === "contribute" && (
            <div className="rounded-xl border border-surface-dim bg-surface p-5">
              <label className="block text-sm font-medium mb-2">
                <DollarSign size={14} className="inline mr-1" />
                이번 달 적립금
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  placeholder="500000"
                  className="flex-1 rounded-lg border border-surface-dim px-3 py-2.5 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-sm text-foreground/60">원</span>
              </div>
            </div>
          )}

          {/* 드리프트 분석 (전체 리밸런싱 모드) */}
          {mode === "rebalance" && drift.length > 0 && (
            <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground/70">드리프트 분석</h2>
              <div className="space-y-2">
                {drift.map((d) => {
                  const overweight = d.drift > 0;
                  const significant = Math.abs(d.drift) >= 3;
                  return (
                    <div key={d.ticker} className="flex items-center gap-3">
                      <div className="w-28 sm:w-36 shrink-0 truncate">
                        <span className="text-sm font-medium">{d.name}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-foreground/50">목표 {d.targetPercent}%</span>
                          <span className={significant ? (overweight ? "text-danger" : "text-primary") : "text-foreground/50"}>
                            현재 {d.currentPercent}% ({d.drift > 0 ? "+" : ""}{d.drift}%)
                          </span>
                        </div>
                        <div className="h-2 bg-surface-dim rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${significant ? (overweight ? "bg-danger" : "bg-primary") : "bg-primary/50"}`}
                            style={{ width: `${Math.min(d.currentPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 매매 지시서 */}
          {activeOrders.length > 0 && (
            <div className="rounded-xl border border-surface-dim bg-surface p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground/70">
                {mode === "contribute" ? "적립 매수 지시서" : "매매 지시서"}
              </h2>

              <div className="space-y-2">
                {activeOrders.map((o) => (
                  <div
                    key={o.ticker}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-surface-dim"
                  >
                    <div className="shrink-0">
                      {o.action === "buy" ? (
                        <ArrowDown size={16} className="text-success" />
                      ) : o.action === "sell" ? (
                        <ArrowUp size={16} className="text-danger" />
                      ) : (
                        <Minus size={16} className="text-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{o.name}</span>
                      <span className="text-xs text-foreground/50 font-mono ml-1">{o.ticker}</span>
                    </div>
                    <div className="text-right shrink-0">
                      {o.action !== "hold" ? (
                        <>
                          <span className={`text-sm font-medium ${o.action === "buy" ? "text-success" : "text-danger"}`}>
                            {o.action === "buy" ? "매수" : "매도"} {o.shares}주
                          </span>
                          <p className="text-xs text-foreground/50">{formatKRW(o.amount)}</p>
                        </>
                      ) : (
                        <span className="text-sm text-foreground/40">유지</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalTradeAmount > 0 && (
                <div className="pt-3 border-t border-surface-dim flex items-center justify-between">
                  <span className="text-sm text-foreground/60">총 매매 금액</span>
                  <span className="text-sm font-semibold">{formatKRW(totalTradeAmount)}</span>
                </div>
              )}
            </div>
          )}

          {activeOrders.length === 0 && mode === "contribute" && Number(contribution) > 0 && (
            <div className="text-center py-8 text-foreground/60 text-sm rounded-xl border border-dashed border-surface-dim">
              현재가 데이터가 부족하여 배분을 계산할 수 없습니다.
            </div>
          )}

          {/* 요약 */}
          <div className="rounded-xl border border-surface-dim bg-surface p-5">
            <h2 className="text-sm font-semibold text-foreground/70 mb-3">포트폴리오 요약</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground/50">총 평가액</p>
                <p className="font-semibold">{formatKRW(totalValue)}</p>
              </div>
              <div>
                <p className="text-foreground/50">예수금</p>
                <p className="font-semibold">{formatKRW(cashBalance)}</p>
              </div>
              <div>
                <p className="text-foreground/50">종목 수</p>
                <p className="font-semibold">{holdings.length}개</p>
              </div>
              <div>
                <p className="text-foreground/50">목표 비중 설정</p>
                <p className="font-semibold">{targets.length}개</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
