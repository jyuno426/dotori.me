"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  ArrowRightLeft,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/portfolios", label: "포트폴리오", icon: Briefcase },
  { href: "/accounts", label: "계좌 관리", icon: Building2 },
  { href: "/rebalance", label: "리밸런싱", icon: ArrowRightLeft },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* 모바일 토글 */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg bg-surface min-w-[44px] min-h-[44px] flex items-center justify-center shadow"
        onClick={() => setOpen(!open)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 bg-surface border-r border-surface-dim flex flex-col transition-transform duration-200 md:translate-x-0 md:static md:z-0",
          !open && "-translate-x-full"
        )}
      >
        {/* 로고 */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-surface-dim">
          <span className="text-2xl" role="img" aria-label="도토리">🌰</span>
          <span className="font-bold text-lg text-primary-dark">도토리</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-surface-dim"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 */}
        <div className="px-4 py-4 border-t border-surface-dim text-xs text-foreground/60">
          한 알씩 모아, 단단한 내일로
        </div>
      </aside>
    </>
  );
}
