"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { LoadingProvider } from "./loading-overlay";

interface AppShellProps {
  user: { email: string; name: string | null } | null;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LoadingProvider>
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {/* 모바일 전용 헤더 */}
          <header className="sticky top-0 z-20 flex items-center h-14 px-4 sm:px-6 bg-surface border-b border-surface-dim md:hidden">
            <button
              className="rounded-lg p-2 -ml-2 hover:bg-surface-dim transition-colors"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="메뉴 열기"
            >
              <Menu size={20} />
            </button>
          </header>
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </LoadingProvider>
  );
}
