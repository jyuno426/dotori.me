"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  FormField,
  Heading,
  Input,
  Select,
  Stack,
  Text,
} from "@/components/ds";

interface Portfolio {
  id: string;
  name: string;
}

const BROKERS = [
  "삼성증권",
  "미래에셋증권",
  "한국투자증권",
  "KB증권",
  "NH투자증권",
  "키움증권",
  "신한투자증권",
  "대신증권",
  "하나증권",
  "메리츠증권",
  "토스증권",
  "카카오페이증권",
  "IBK투자증권",
  "유안타증권",
  "한화투자증권",
  "DB금융투자",
  "교보증권",
  "현대차증권",
  "BNK투자증권",
  "부국증권",
  "SK증권",
  "케이프투자증권",
  "iM증권",
];

export default function NewAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultPortfolioId = searchParams.get("portfolioId") ?? "";

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then((pfs: Portfolio[]) => {
        setPortfolios(pfs);
        if (defaultPortfolioId && pfs.some((p) => p.id === defaultPortfolioId)) {
          setSelectedPortfolioId(defaultPortfolioId);
        }
      });
  }, [defaultPortfolioId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolioId: form.get("portfolioId"),
        name: form.get("name") || null,
        broker: form.get("broker"),
        accountType: form.get("accountType"),
        owner: form.get("owner") || null,
      }),
    });

    if (res.ok) {
      router.push(`/portfolios/${selectedPortfolioId}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "계좌 생성에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <Stack gap="lg">
        <Heading as="h1" level="heading-2">
          새 계좌 등록
        </Heading>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <FormField label="포트폴리오" htmlFor="portfolioId" required>
              <Select
                id="portfolioId"
                name="portfolioId"
                required
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
              >
                <option value="">선택해주세요</option>
                {portfolios.map((pf) => (
                  <option key={pf.id} value={pf.id}>
                    {pf.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="계좌 유형" htmlFor="accountType" required>
              <Select id="accountType" name="accountType" required>
                <option value="irp">IRP</option>
                <option value="pension">연금저축</option>
                <option value="isa">ISA</option>
                <option value="brokerage">일반 위탁</option>
                <option value="cma">CMA</option>
              </Select>
            </FormField>

            <FormField label="증권사" htmlFor="broker" required>
              <Select id="broker" name="broker" required>
                <option value="">선택해주세요</option>
                {BROKERS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="계좌 별칭" htmlFor="name">
              <Input
                id="name"
                name="name"
                placeholder="삼성 IRP, 키움 위탁"
              />
            </FormField>

            <FormField label="소유자" htmlFor="owner">
              <Input id="owner" name="owner" placeholder="본인, 배우자" />
            </FormField>

            {error && (
              <Text size="body-sm" tone="danger">
                {error}
              </Text>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={loading}
              >
                {loading ? "등록 중..." : "등록"}
              </Button>
            </div>
          </Stack>
        </form>
      </Stack>
    </div>
  );
}
