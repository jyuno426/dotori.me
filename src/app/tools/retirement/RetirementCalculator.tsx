"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  simulateRetirement,
  type RetirementInput,
} from "@/lib/retirement-calc";
import { Card, Heading, Text, Button, Eyebrow } from "@/components/ds";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "dotori-retirement-input-v1";

const DEFAULT_INPUT: RetirementInput = {
  currentAge: 30,
  retirementAge: 65,
  currentAssets: 3000,
  monthlySavings: 50,
  monthlyExpenseInToday: 250,
};

function formatKorean(manwon: number): string {
  if (!isFinite(manwon)) return "—";
  if (manwon === 0) return "0";
  const sign = manwon < 0 ? "-" : "";
  const abs = Math.abs(manwon);
  if (abs >= 10000) {
    const eok = abs / 10000;
    const decimal = eok >= 100 ? 0 : 1;
    return `${sign}${eok.toFixed(decimal)}억`;
  }
  return `${sign}${Math.round(abs).toLocaleString("ko-KR")}만원`;
}

function formatPlainManwon(manwon: number): string {
  if (!isFinite(manwon)) return "—";
  return Math.round(manwon).toLocaleString("ko-KR");
}

export function RetirementCalculator() {
  const [input, setInput] = useState<RetirementInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: Partial<RetirementInput> | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        restored = JSON.parse(saved) as Partial<RetirementInput>;
      }
    } catch {
      /* localStorage 접근 실패 시 디폴트 사용 */
    }
    queueMicrotask(() => {
      if (restored) setInput((prev) => ({ ...prev, ...restored }));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* localStorage 쓰기 실패 시 무시 */
    }
  }, [input, hydrated]);

  const safeRetirementAge = Math.max(input.retirementAge, input.currentAge + 1);
  const safeInput: RetirementInput = {
    ...input,
    retirementAge: safeRetirementAge,
  };
  const result = simulateRetirement(safeInput);

  function update<K extends keyof RetirementInput>(
    key: K,
    value: RetirementInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <header className="mb-10 sm:mb-14 text-center">
        <Eyebrow>은퇴 자금 계산기</Eyebrow>
        <Heading as="h1" level="display" className="mt-3">
          노후, 진짜 얼마 필요할까요?
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-4 max-w-xl mx-auto">
          90초 안에 분명한 숫자로 바꿔드려요. 가입 없이 지금 바로 확인할 수
          있어요.
        </Text>
      </header>

      <Card padding="lg" className="space-y-7" radius="xl">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden />
          <Text size="label" tone="muted">
            5개만 입력하면 충분해요
          </Text>
        </div>

        <NumberSlider
          label="현재 나이"
          value={input.currentAge}
          min={20}
          max={60}
          step={1}
          unit="세"
          onChange={(v) => update("currentAge", v)}
        />

        <NumberSlider
          label="현재 총 자산"
          value={input.currentAssets}
          min={0}
          max={200000}
          step={100}
          unit="만원"
          displayValue={formatKorean(input.currentAssets)}
          hint="퇴직연금(DC)·ISA·연금저축·예금·적금 모두 합산. 대략값이면 충분해요."
          onChange={(v) => update("currentAssets", v)}
        />

        <NumberSlider
          label="월 저축 가능액"
          value={input.monthlySavings}
          min={0}
          max={500}
          step={5}
          unit="만원"
          hint="월급에서 자동이체로 떼는 금액 + 추가 저축액"
          onChange={(v) => update("monthlySavings", v)}
        />

        <NumberSlider
          label="은퇴 후 월 생활비 (현재 가치)"
          value={input.monthlyExpenseInToday}
          min={0}
          max={1000}
          step={10}
          unit="만원"
          hint="지금 기준으로 매달 받고 싶은 금액. 미래 물가는 자동으로 반영해요."
          onChange={(v) => update("monthlyExpenseInToday", v)}
        />

        <NumberSlider
          label="은퇴 희망 연령"
          value={safeRetirementAge}
          min={Math.max(input.currentAge + 1, 50)}
          max={75}
          step={1}
          unit="세"
          onChange={(v) => update("retirementAge", v)}
        />
      </Card>

      <ResultPanel result={result} hydrated={hydrated} />

      <Disclaimer />
    </>
  );
}

interface NumberSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  displayValue?: string;
  onChange: (value: number) => void;
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  displayValue,
  onChange,
}: NumberSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const showDisplay = displayValue && displayValue !== `${value}${unit}`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-label text-foreground-strong">{label}</label>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              onChange(Math.max(min, Math.min(max, next)));
            }}
            className={cn(
              "w-28 h-10 px-3 rounded-md bg-surface border border-border",
              "text-right text-body nums",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            )}
            aria-label={label}
          />
          <span className="text-label-sm text-foreground-muted shrink-0">
            {unit}
          </span>
        </div>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dotori-slider w-full"
        style={{ "--fill": `${percent}%` } as React.CSSProperties}
        aria-label={`${label} 슬라이더`}
      />

      {showDisplay && (
        <p className="text-label-sm text-primary-dark nums">{displayValue}</p>
      )}
      {hint && (
        <p className="text-label-sm text-foreground-subtle">{hint}</p>
      )}
    </div>
  );
}

interface ResultPanelProps {
  result: ReturnType<typeof simulateRetirement>;
  hydrated: boolean;
}

function ResultPanel({ result, hydrated }: ResultPanelProps) {
  const isSurplus = result.surplus > 0;

  return (
    <section className="mt-10 sm:mt-12 space-y-6">
      <Card tone="primary" padding="lg" radius="xl" className="relative">
        <div className="absolute right-5 top-5 opacity-70">
          <AcornIcon className="w-10 h-10" />
        </div>

        <Eyebrow tone="primary">진단 결과</Eyebrow>

        {isSurplus ? (
          <>
            <Heading as="h2" level="heading-1" className="mt-3">
              이미 충분히 가고 계세요
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              지금 페이스대로면 은퇴 시점에 약{" "}
              <span className="text-foreground-strong nums">
                {formatKorean(result.projectedAssets)}
              </span>
              까지 도달해요. 더 일찍 멈춰도 좋고, 다른 곳에 마음 편히 쓰셔도
              괜찮아요.
            </Text>
          </>
        ) : (
          <>
            <Heading as="h2" level="heading-1" className="mt-3">
              {hydrated ? formatKorean(result.neededAssets) : "—"} 정도면 든든해요
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              지금 페이스로는{" "}
              <span className="text-foreground-strong nums">
                {formatKorean(result.projectedAssets)}
              </span>
              까지 와요. 남은 건{" "}
              <span className="text-primary-dark nums font-medium">
                {formatKorean(result.gap)}
              </span>
              {" "}이 정도예요.
            </Text>
            <Text size="body" className="mt-4 text-foreground-strong">
              이미 한 발은 시작하셨어요. 큰 부분은 이미 와 있고, 남은 만큼만
              지금부터 채워가면 돼요.
            </Text>
          </>
        )}
      </Card>

      {!isSurplus && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card padding="md" radius="xl">
            <Eyebrow tone="muted">현재 페이스</Eyebrow>
            <Heading as="h3" level="heading-2" className="mt-2 nums">
              {formatKorean(result.projectedAssets)}
            </Heading>
            <Text size="body-sm" tone="muted" className="mt-2">
              지금처럼 월 저축만 이어갔을 때 도달 자산이에요.
            </Text>
          </Card>

          <Card
            padding="md"
            radius="xl"
            tone="primary"
            className="border-primary-200/70"
          >
            <Eyebrow tone="primary">도토리와 함께</Eyebrow>
            <div className="mt-2 flex items-baseline gap-2">
              <Heading
                as="h3"
                level="heading-2"
                tone="primary"
                className="nums"
              >
                +{formatKorean(result.improvedScenario.catchUpAmount)}
              </Heading>
            </div>
            <Text size="body-sm" tone="muted" className="mt-2">
              자산배분으로 평균 수익률 +1%p, 월 저축 +
              <span className="nums">
                {formatPlainManwon(result.additionalMonthlySavings)}
              </span>
              만원 더하면 따라잡을 수 있어요.
            </Text>
          </Card>
        </div>
      )}

      <Card padding="lg" radius="xl" tone="muted">
        <Heading as="h3" level="title-lg">
          한 알씩 시작해볼까요?
        </Heading>
        <Text size="body" tone="muted" className="mt-2">
          도토리는 *어느 계좌에 어느 종목 몇 주*까지 매달 정리해드려요. 매매는
          증권사 앱에서 직접, 매달 5분이면 끝나요.
        </Text>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            href="/tools/portfolio-quiz"
            variant="primary"
            size="lg"
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            맞는 자산배분 골라보기
          </Button>
          <Button href="/signup" variant="outline" size="lg">
            바로 가입할게요
          </Button>
        </div>
      </Card>
    </section>
  );
}

function Disclaimer() {
  return (
    <p className="mt-10 text-caption text-foreground-subtle leading-relaxed text-center max-w-xl mx-auto">
      본 계산기의 결과는 일반적인 가정(실질 수익률 4%, 인출률 4% 등)에 기반한
      시뮬레이션이며, 실제 투자 성과를 보장하지 않습니다. 개인 상황에 따라 결과가
      달라질 수 있어요.
    </p>
  );
}
