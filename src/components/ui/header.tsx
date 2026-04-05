"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: { email: string; name: string | null } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-surface border-b border-surface-dim">
      <div className="md:hidden w-[44px]" /> {/* 모바일 메뉴 버튼 공간 */}
      <span className="text-sm font-semibold text-foreground/80 hidden md:block">
        도토리
      </span>
      {user && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-foreground/70">
            <User size={14} />
            {user.name ?? user.email}
          </span>
          <button
            onClick={handleLogout}
            aria-label="로그아웃"
            className="flex items-center gap-1.5 text-sm text-foreground/70 hover:text-danger transition-colors rounded-lg px-2 py-2 min-h-[44px]"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
