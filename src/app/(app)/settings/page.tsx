"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Check } from "lucide-react";

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
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-xl font-bold">설정</h1>

      {/* 프로필 */}
      <section className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/70">프로필</h2>

        {profile && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/60">이메일</label>
              <p className="text-sm">{profile.email}</p>
            </div>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">이름</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-dim px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <Check size={14} />
                    저장됨
                  </span>
                )}
              </div>
            </form>
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </section>

      {/* 테마 */}
      <section className="rounded-xl border border-surface-dim bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/70">화면 테마</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {dark ? <Moon size={16} /> : <Sun size={16} />}
            {dark ? "다크 모드" : "라이트 모드"}
          </div>
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
            style={{ backgroundColor: dark ? "var(--color-primary)" : "var(--color-surface-dim)" }}
            aria-label="테마 전환"
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: dark ? "translateX(22px)" : "translateX(4px)" }}
            />
          </button>
        </div>
      </section>

      {/* 로그아웃 */}
      <section className="rounded-xl border border-surface-dim bg-surface p-5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-danger hover:underline"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </section>
    </div>
  );
}
