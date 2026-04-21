"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { Button, FormField, Heading, Input, Stack, Text } from "@/components/ds";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password,
        name: form.get("name"),
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "회원가입에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <AcornIcon className="w-12 h-12 mx-auto" />
          <Heading as="h1" level="heading-2" tone="primary" className="mt-3">
            회원가입
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-1">
            도토리와 함께 투자를 시작하세요
          </Text>
        </div>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <FormField
              label={
                <>
                  이름{" "}
                  <span className="text-foreground-subtle font-normal">
                    (선택)
                  </span>
                </>
              }
              htmlFor="name"
            >
              <Input id="name" name="name" type="text" placeholder="홍길동" />
            </FormField>
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
                minLength={8}
                placeholder="8자 이상"
              />
            </FormField>
            <FormField label="비밀번호 확인" htmlFor="confirm" required>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                placeholder="비밀번호 재입력"
              />
            </FormField>

            {error && (
              <Text size="body-sm" tone="danger">
                {error}
              </Text>
            )}

            <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </Button>
          </Stack>
        </form>

        <Text size="body-sm" tone="muted" className="text-center">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            로그인
          </Link>
        </Text>
      </div>
    </div>
  );
}
