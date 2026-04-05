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

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/portfolios", label: "포트폴리오", icon: Briefcase },
  { href: "/accounts", label: "계좌 관리", icon: Building2 },
  { href: "/rebalance", label: "리밸런싱", icon: ArrowRightLeft },
  { href: "/settings", label: "설정", icon: Settings },
];

function AcornIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 도토리 꼭지 */}
      <path
        d="M32 6 C30 6 28 8 28 10 L28 14 C28 14 30 13 32 13 C34 13 36 14 36 14 L36 10 C36 8 34 6 32 6Z"
        fill="#6B8E23"
      />
      {/* 도토리 모자 */}
      <path
        d="M18 18 C18 14 24 12 32 12 C40 12 46 14 46 18 L46 24 C46 26 44 28 42 28 L22 28 C20 28 18 26 18 24 Z"
        fill="#8B7355"
      />
      <path
        d="M20 20 L44 20"
        stroke="#7A6245"
        strokeWidth="1.5"
      />
      <path
        d="M20 24 L44 24"
        stroke="#7A6245"
        strokeWidth="1.5"
      />
      {/* 도토리 몸통 */}
      <path
        d="M20 28 C20 28 18 42 22 50 C26 58 38 58 42 50 C46 42 44 28 44 28 Z"
        fill="#C8A26E"
      />
      <path
        d="M26 32 C26 32 28 46 32 50"
        stroke="#B8924E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
