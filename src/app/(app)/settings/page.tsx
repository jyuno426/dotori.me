"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Check } from "lucide-react";
import {
  Button,
  Card,
  FormField,
  Heading,
  Input,
  PageHeader,
  Stack,
  Text,
} from "@/components/ds";
import { cn } from "@/lib/cn";

interface Profile {
  id: string;
  email: string;
  name: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));

    fetch("/api/auth/profile")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p: Profile) => {
        setProfile(p);
        setName(p.name ?? "");
      })
      .catch(() => setError("프로필을 불러오는데 실패했습니다."));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다.");
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!profile && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Text tone="muted">로딩 중...</Text>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Stack gap="xl">
        <PageHeader title="설정" />

        <Card padding="md" radius="lg">
          <Stack gap="md">
            <Heading as="h2" level="title-sm" tone="muted">
              프로필
            </Heading>

            {profile && (
              <>
                <FormField label="이메일">
                  <Text size="body-sm">{profile.email}</Text>
                </FormField>

                <form onSubmit={handleSaveName}>
                  <Stack gap="sm">
                    <FormField label="이름" htmlFor="profile-name">
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                      />
                    </FormField>
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={saving}
                      >
                        {saving ? "저장 중..." : "저장"}
                      </Button>
                      {saved && (
                        <span className="flex items-center gap-1 text-label text-success">
                          <Check size={14} />
                          저장됨
                        </span>
                      )}
                    </div>
                  </Stack>
                </form>
              </>
            )}

            {error && (
              <Text size="body-sm" tone="danger">
                {error}
              </Text>
            )}
          </Stack>
        </Card>

        <Card padding="md" radius="lg">
          <Stack gap="md">
            <Heading as="h2" level="title-sm" tone="muted">
              화면 테마
            </Heading>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-body-sm">
                {dark ? <Moon size={16} /> : <Sun size={16} />}
                {dark ? "다크 모드" : "라이트 모드"}
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-[var(--duration-fast)]",
                  dark ? "bg-primary" : "bg-surface-subtle",
                )}
                aria-label="테마 전환"
                aria-pressed={dark}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-[var(--duration-fast)]",
                    dark ? "translate-x-[22px]" : "translate-x-[4px]",
                  )}
                />
              </button>
            </div>
          </Stack>
        </Card>

        <Card padding="md" radius="lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            iconLeft={<LogOut size={16} />}
            className="text-danger hover:text-danger"
          >
            로그아웃
          </Button>
        </Card>
      </Stack>
    </div>
  );
}
