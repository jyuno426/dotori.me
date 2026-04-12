"use client";

import { Menu, User } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  user: { email: string; name: string | null } | null;
  onMenuToggle?: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 sm:px-6 bg-surface border-b border-surface-dim">
      {/* 모바일 메뉴 버튼 */}
      <button
        className="md:hidden rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-dim transition-colors"
        onClick={onMenuToggle}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>
      <span className="text-sm font-semibold text-foreground/80 hidden md:block">
        도토리
      </span>
      {user && (
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors rounded-lg px-2 py-2 min-h-[44px]"
        >
          <User size={14} />
          {user.name ?? user.email}
        </Link>
      )}
    </header>
  );
}
