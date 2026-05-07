"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import {
  QUESTIONS,
  calculateScore,
  needsTiebreaker,
  recommendByScore,
  type QuizAnswers,
  type AnswerScore,
} from "@/lib/risk-profile";
import {
  PORTFOLIO_PRESETS,
  ASSET_CATEGORIES,
  PRESET_ORDER,
  type PortfolioPreset,
  type PresetKey,
  type AssetCategoryKey,
} from "@/data/portfolio-presets";
import { Card, Heading, Text, Button, Eyebrow, Pill } from "@/components/ds";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { cn } from "@/lib/cn";

type Step = "intro" | "q1" | "q2" | "q3" | "result";

export function PortfolioQuiz() {
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showCompare, setShowCompare] = useState(false);

  function answer(qid: "q1" | "q2" | "q3", score: AnswerScore) {
    const next = { ...answers, [qid]: score };
    setAnswers(next);

    if (qid === "q1") {
      setStep("q2");
      return;
    }
    if (qid === "q2") {
      if (needsTiebreaker(next)) {
        setStep("q3");
      } else {
        setStep("result");
      }
      return;
    }
    if (qid === "q3") {
      setStep("result");
    }
  }

  function reset() {
    setAnswers({});
    setShowCompare(false);
    setStep("intro");
  }

  function back() {
    if (step === "q2") setStep("q1");
    else if (step === "q3") setStep("q2");
    else if (step === "result") {
      setStep(needsTiebreaker(answers) ? "q3" : "q2");
    }
  }

  const score = calculateScore(answers);
  const recommendation = score != null ? recommendByScore(score) : null;

  return (
    <>
      <header className="mb-10 sm:mb-14 text-center">
        <Eyebrow>자산배분 진단</Eyebrow>
        <Heading as="h1" level="display" className="mt-3">
          내게 맞는 자산배분
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-4 max-w-xl mx-auto">
          2~3분, 두세 문항이면 끝나요. 4가지 검증된 자산배분 중 결이 맞는 것을
          찾아드릴게요.
        </Text>
      </header>

      {step !== "intro" && step !== "result" && (
        <ProgressBar step={step} answers={answers} />
      )}

      {step === "intro" && <IntroPanel onStart={() => setStep("q1")} />}

      {(step === "q1" || step === "q2" || step === "q3") && (
        <QuestionPanel
          step={step}
          answers={answers}
          onAnswer={answer}
          onBack={step !== "q1" ? back : undefined}
        />
      )}

      {step === "result" && recommendation && (
        <ResultPanel
          primary={PORTFOLIO_PRESETS[recommendation.primary]}
          secondary={PORTFOLIO_PRESETS[recommendation.secondary]}
          showCompare={showCompare}
          onToggleCompare={() => setShowCompare((v) => !v)}
          onReset={reset}
          onBack={back}
        />
      )}

      <Disclaimer />
    </>
  );
}

function ProgressBar({
  step,
  answers,
}: {
  step: Step;
  answers: QuizAnswers;
}) {
  const total = needsTiebreaker(answers) ? 3 : 2;
  const current = step === "q1" ? 1 : step === "q2" ? 2 : 3;

  return (
    <div className="mb-6 flex items-center gap-3">
      <Text size="label-sm" tone="muted" className="nums">
        {current} / {total}
      </Text>
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <Card padding="lg" radius="xl" tone="primary" className="text-center">
      <div className="flex justify-center mb-4">
        <AcornIcon className="w-14 h-14" />
      </div>
      <Heading as="h2" level="heading-2">
        가장 결이 맞는 한 길을 찾아드릴게요
      </Heading>
      <Text size="body" tone="muted" className="mt-3 max-w-md mx-auto">
        영구포트폴리오, K-올웨더형, 글로벌 60/40, 30대 성장형 — 책과 미디어에서
        검증된 4가지 중 1순위와 2순위를 보여드려요.
      </Text>
      <div className="mt-7">
        <Button
          onClick={onStart}
          variant="primary"
          size="lg"
          iconRight={<ArrowRight className="w-4 h-4" />}
        >
          시작하기
        </Button>
      </div>
    </Card>
  );
}

interface QuestionPanelProps {
  step: "q1" | "q2" | "q3";
  answers: QuizAnswers;
  onAnswer: (qid: "q1" | "q2" | "q3", score: AnswerScore) => void;
  onBack?: () => void;
}

function QuestionPanel({ step, answers, onAnswer, onBack }: QuestionPanelProps) {
  const idx = step === "q1" ? 0 : step === "q2" ? 1 : 2;
  const question = QUESTIONS[idx];
  const currentScore = answers[step];

  return (
    <Card padding="lg" radius="xl" className="space-y-5">
      <div className="flex items-center gap-2 text-foreground-muted">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden />
        <Text size="label" tone="muted">
          {step === "q3" ? "마지막 한 가지만 더" : "솔직하게 답해도 괜찮아요"}
        </Text>
      </div>

      <Heading as="h2" level="heading-2">
        {question.prompt}
      </Heading>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const isSelected = currentScore === opt.score;
          return (
            <button
              key={opt.score}
              type="button"
              onClick={() => onAnswer(step, opt.score)}
              className={cn(
                "w-full text-left rounded-xl border p-5 transition-colors duration-[var(--duration-fast)]",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                isSelected
                  ? "border-primary bg-primary-50/60"
                  : "border-border hover:border-primary-200 hover:bg-surface-muted/40",
              )}
            >
              <Text size="body" className="text-foreground-strong">
                {opt.label}
              </Text>
            </button>
          );
        })}
      </div>

      {onBack && (
        <div className="pt-2">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            iconLeft={<ArrowLeft className="w-4 h-4" />}
          >
            이전으로
          </Button>
        </div>
      )}
    </Card>
  );
}

interface ResultPanelProps {
  primary: PortfolioPreset;
  secondary: PortfolioPreset;
  showCompare: boolean;
  onToggleCompare: () => void;
  onReset: () => void;
  onBack: () => void;
}

function ResultPanel({
  primary,
  secondary,
  showCompare,
  onToggleCompare,
  onReset,
  onBack,
}: ResultPanelProps) {
  return (
    <section className="space-y-6">
      <Card tone="primary" padding="lg" radius="xl" className="relative">
        <div className="absolute right-5 top-5 opacity-70">
          <AcornIcon className="w-10 h-10" />
        </div>
        <Eyebrow tone="primary">진단 결과</Eyebrow>
        <Heading as="h2" level="heading-1" className="mt-3">
          {primary.matchCopy}
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-3">
          당신께는{" "}
          <span className="text-foreground-strong font-medium">
            {primary.name}
          </span>
          이 잘 어울려요.
        </Text>
      </Card>

      <PresetCard preset={primary} highlighted />

      <div>
        <Text size="label" tone="muted" className="mb-3">
          이런 선택지도 잘 맞아요
        </Text>
        <PresetCard preset={secondary} />
      </div>

      <Card padding="md" radius="xl" tone="muted">
        <button
          type="button"
          onClick={onToggleCompare}
          className="w-full flex items-center justify-between text-left text-label text-foreground-strong"
        >
          <span>4가지 모두 비교하기</span>
          <span aria-hidden className="text-foreground-muted">
            {showCompare ? "−" : "+"}
          </span>
        </button>
        {showCompare && (
          <div className="mt-5 -mx-5 sm:mx-0 overflow-x-auto">
            <CompareTable />
          </div>
        )}
      </Card>

      <Card padding="lg" radius="xl">
        <Heading as="h3" level="title-lg">
          이걸로 시작해볼까요?
        </Heading>
        <Text size="body" tone="muted" className="mt-2">
          도토리는 매달 *어느 계좌에 어느 종목 몇 주*까지 정리해드려요. 매매는
          증권사 앱에서, 매달 5분이면 끝나요.
        </Text>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            href="/signup"
            variant="primary"
            size="lg"
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            도토리에서 시작하기
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            size="lg"
            iconLeft={<ArrowLeft className="w-4 h-4" />}
          >
            이전 답변 수정
          </Button>
          <Button
            onClick={onReset}
            variant="ghost"
            size="lg"
            iconLeft={<RefreshCw className="w-4 h-4" />}
          >
            처음부터 다시
          </Button>
        </div>
      </Card>
    </section>
  );
}

function PresetCard({
  preset,
  highlighted,
}: {
  preset: PortfolioPreset;
  highlighted?: boolean;
}) {
  const stockTotal =
    preset.weights["kr-stock"] +
    preset.weights["us-stock"] +
    preset.weights["dev-stock"] +
    preset.weights["em-stock"];
  const bondTotal =
    preset.weights["kr-bond"] + preset.weights["us-bond"];
  const goldTotal = preset.weights.gold;
  const altTotal = preset.weights.alt;

  return (
    <Card
      padding="lg"
      radius="xl"
      tone={highlighted ? "default" : "default"}
      className={cn(highlighted && "border-primary-200")}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <Heading as="h3" level="heading-2">
            {preset.name}
          </Heading>
          <Text size="caption" tone="subtle" className="mt-1">
            {preset.source}
          </Text>
        </div>
        {highlighted && (
          <Pill tone="primary" dot>
            1순위
          </Pill>
        )}
      </div>

      <div className="space-y-2 mb-5">
        <BigGroupRow label="주식" percent={stockTotal} tone="primary" />
        <BigGroupRow label="채권" percent={bondTotal} tone="accent" />
        {goldTotal > 0 && (
          <BigGroupRow label="금" percent={goldTotal} tone="muted" />
        )}
        {altTotal > 0 && (
          <BigGroupRow label="대안" percent={altTotal} tone="muted" />
        )}
      </div>

      <Text size="body-sm" tone="muted">
        {preset.blurb}
      </Text>
    </Card>
  );
}

function BigGroupRow({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: "primary" | "accent" | "muted";
}) {
  const fillClass =
    tone === "primary"
      ? "bg-primary"
      : tone === "accent"
        ? "bg-accent-dark"
        : "bg-foreground-subtle";

  return (
    <div className="flex items-center gap-3">
      <Text size="label-sm" tone="muted" className="w-12 shrink-0">
        {label}
      </Text>
      <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", fillClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <Text size="label-sm" className="w-12 text-right nums tabular-nums">
        {percent}%
      </Text>
    </div>
  );
}

function CompareTable() {
  const categories: AssetCategoryKey[] = [
    "kr-stock",
    "us-stock",
    "dev-stock",
    "em-stock",
    "kr-bond",
    "us-bond",
    "gold",
    "alt",
  ];

  return (
    <table className="w-full text-body-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-3 text-label-sm text-foreground-muted font-normal">
            자산군
          </th>
          {PRESET_ORDER.map((key) => (
            <th
              key={key}
              className="text-right p-3 text-label-sm text-foreground-strong font-medium"
            >
              {PORTFOLIO_PRESETS[key].name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categories.map((cat) => (
          <tr key={cat} className="border-b border-border/50">
            <td className="p-3 text-foreground-muted">
              {ASSET_CATEGORIES[cat].name}
            </td>
            {PRESET_ORDER.map((key) => {
              const w = PORTFOLIO_PRESETS[key].weights[cat];
              return (
                <td
                  key={key}
                  className="p-3 text-right nums tabular-nums text-foreground"
                >
                  {w === 0 ? "—" : `${w}%`}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Disclaimer() {
  return (
    <p className="mt-10 text-caption text-foreground-subtle leading-relaxed text-center max-w-xl mx-auto">
      본 진단은 일반적인 자산배분 안내용이며, 특정 종목·증권사·금융상품을
      추천하지 않습니다. 실제 투자 성과를 보장하지 않으며, 개인 상황에 따라
      결과가 달라질 수 있어요.
    </p>
  );
}

export type { PresetKey };
