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
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 bg-surface border-b border-surface-dim md:pl-6">
      <div className="md:hidden w-10" /> {/* 모바일 메뉴 버튼 공간 */}
      <h1 className="text-sm font-semibold text-foreground/80 hidden md:block">
        도토리
      </h1>
      {user && (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-foreground/60">
            <User size={14} />
            {user.name ?? user.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-foreground/50 hover:text-danger transition-colors"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
