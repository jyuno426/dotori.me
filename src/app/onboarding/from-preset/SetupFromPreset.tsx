"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  PORTFOLIO_PRESETS,
  ASSET_CATEGORIES,
  type PresetKey,
  type AssetCategoryKey,
} from "@/data/portfolio-presets";
import {
  Card,
  Heading,
  Text,
  Button,
  Eyebrow,
  FormField,
  Input,
  Select,
  Stack,
} from "@/components/ds";
import { AcornIcon } from "@/components/ui/acorn-icon";

const STORAGE_KEY = "dotori-quiz-preset";

const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "brokerage", label: "일반 위탁" },
  { value: "isa", label: "ISA" },
  { value: "pension", label: "연금저축" },
  { value: "irp", label: "IRP" },
  { value: "cma", label: "CMA" },
];

export function SetupFromPreset() {
  const router = useRouter();
  const [presetKey, setPresetKey] = useState<PresetKey | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [accountName, setAccountName] = useState("내 계좌");
  const [accountType, setAccountType] = useState("brokerage");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* localStorage 접근 실패 시 디폴트 */
    }
    queueMicrotask(() => {
      if (saved && saved in PORTFOLIO_PRESETS) {
        const key = saved as PresetKey;
        setPresetKey(key);
        setPortfolioName(`내 ${PORTFOLIO_PRESETS[key].name} 포트폴리오`);
      }
      setHydrated(true);
    });
  }, []);

  if (!hydrated) {
    return null;
  }

  if (!presetKey) {
    return (
      <Card padding="lg" radius="xl">
        <Heading as="h2" level="heading-2">
          진단 결과가 없어요
        </Heading>
        <Text size="body" tone="muted" className="mt-3">
          먼저 자산배분 진단을 받아보시면, 결이 맞는 프리셋으로 한 번에
          포트폴리오를 만들어드려요.
        </Text>
        <div className="mt-6 flex gap-3">
          <Button
            href="/tools/portfolio-quiz"
            variant="primary"
            size="md"
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            진단 받으러 가기
          </Button>
          <Button href="/dashboard" variant="ghost" size="md">
            대시보드로
          </Button>
        </div>
      </Card>
    );
  }

  const preset = PORTFOLIO_PRESETS[presetKey];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/from-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetKey,
          portfolioName: portfolioName.trim(),
          accountName: accountName.trim(),
          accountType,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "설정 중 오류가 발생했어요.");
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
      router.push("/rebalance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  }

  const categories = Object.keys(preset.weights) as AssetCategoryKey[];
  const activeCategories = categories.filter((c) => preset.weights[c] > 0);

  return (
    <form onSubmit={handleSubmit}>
      <Card tone="primary" padding="lg" radius="xl" className="relative mb-6">
        <div className="absolute right-5 top-5 opacity-70">
          <AcornIcon className="w-10 h-10" />
        </div>
        <Eyebrow tone="primary">진단에서 고른 자산배분</Eyebrow>
        <Heading as="h2" level="heading-2" className="mt-3">
          {preset.name}
        </Heading>
        <Text size="body" tone="muted" className="mt-2">
          {preset.matchCopy}
        </Text>
      </Card>

      <Card padding="lg" radius="xl" className="mb-6">
        <Eyebrow tone="muted">한 번에 채워드릴 것들</Eyebrow>
        <ul className="mt-3 space-y-2 text-body-sm text-foreground">
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground-strong">포트폴리오 한 개</strong>{" "}
              — {preset.name} 비중 그대로
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground-strong">
                목표 비중 {activeCategories.length}개
              </strong>{" "}
              — 자산군별 대표 ETF로 (언제든 바꾸실 수 있어요)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground-strong">시작 계좌 한 개</strong>{" "}
              — 이름·종류만 골라주세요
            </span>
          </li>
        </ul>

        <div className="mt-5 grid gap-2">
          {activeCategories.map((cat) => {
            const weight = preset.weights[cat];
            return (
              <div
                key={cat}
                className="flex items-center gap-3 text-label-sm"
              >
                <span className="w-24 text-foreground-muted shrink-0">
                  {ASSET_CATEGORIES[cat].name}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${weight}%` }}
                  />
                </div>
                <span className="w-12 text-right nums tabular-nums text-foreground">
                  {weight}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding="lg" radius="xl" className="mb-6">
        <Stack gap="md">
          <FormField label="포트폴리오 이름" htmlFor="portfolio-name">
            <Input
              id="portfolio-name"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="내 노후 자금"
              required
            />
          </FormField>
          <FormField label="첫 계좌 이름" htmlFor="account-name">
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="키움 위탁 / 미래에셋 ISA 등"
            />
          </FormField>
          <FormField
            label="계좌 종류"
            htmlFor="account-type"
            hint="가장 먼저 시작할 계좌예요. 추가 계좌는 나중에 더할 수 있어요."
          >
            <Select
              id="account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
        </Stack>
      </Card>

      {error && (
        <Text size="body-sm" tone="danger" className="mb-4">
          {error}
        </Text>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || !portfolioName.trim()}
        iconRight={<ArrowRight className="w-4 h-4" />}
      >
        {submitting ? "셋업 중..." : "이대로 시작하기"}
      </Button>
    </form>
  );
}
