"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  ArrowRightLeft,
  Settings,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AcornIcon } from "./acorn-icon";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/portfolios", label: "포트폴리오", icon: Briefcase },
  { href: "/accounts", label: "계좌 관리", icon: Building2 },
  { href: "/rebalance", label: "리밸런싱", icon: ArrowRightLeft },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-dvh w-60 bg-surface border-r border-surface-dim flex flex-col transition-transform duration-200",
          "md:translate-x-0 md:static md:z-0 md:h-auto md:min-h-screen",
          !open && "-translate-x-full"
        )}
      >
        {/* 로고 */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-surface-dim">
          <AcornIcon className="w-7 h-7" />
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
                onClick={onClose}
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
