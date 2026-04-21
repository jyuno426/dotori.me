"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormField,
  Heading,
  Input,
  Stack,
  Text,
} from "@/components/ds";

export default function NewPortfolioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/portfolios/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "포트폴리오 생성에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <Stack gap="lg">
        <Heading as="h1" level="heading-2">
          새 포트폴리오
        </Heading>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <FormField label="이름" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                required
                placeholder="내 자산배분 포트폴리오"
              />
            </FormField>
            <FormField label="설명 (선택)" htmlFor="description">
              <Input
                id="description"
                name="description"
                placeholder="주식 60% / 채권 40% 자산배분"
              />
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
                {loading ? "생성 중..." : "생성"}
              </Button>
            </div>
          </Stack>
        </form>
      </Stack>
    </div>
  );
}
