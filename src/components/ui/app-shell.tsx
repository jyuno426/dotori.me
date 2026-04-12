"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { LoadingOverlay } from "./loading-overlay";

interface AppShellProps {
  user: { email: string; name: string | null } | null;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 overflow-auto">
          {children}
        </main>
      </div>
      <LoadingOverlay />
    </div>
  );
}
