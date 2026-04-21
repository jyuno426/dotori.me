"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { Button, FormField, Heading, Input, Stack, Text } from "@/components/ds";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "로그인에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link
            href="/"
            aria-label="도토리 소개 페이지로"
            className="inline-flex flex-col items-center group transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
          >
            <AcornIcon className="w-12 h-12" />
            <Heading as="h1" level="heading-2" tone="primary" className="mt-3">
              도토리
            </Heading>
          </Link>
          <Text size="body-sm" tone="muted" className="mt-1">
            ETF 자산배분 포트폴리오 관리
          </Text>
        </div>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <FormField label="이메일" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="비밀번호" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </FormField>

            {error && (
              <Text size="body-sm" tone="danger">
                {error}
              </Text>
            )}

            <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </Stack>
        </form>

        <Text size="body-sm" tone="muted" className="text-center">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            회원가입
          </Link>
        </Text>
      </div>
    </div>
  );
}
