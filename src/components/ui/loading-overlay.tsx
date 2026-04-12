"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

interface LoadingContextType {
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoading: () => {},
  hideLoading: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // 라우트 전환 완료 시 로딩 해제
  useEffect(() => {
    if (pathname !== prevPathname) {
      setPrevPathname(pathname);
      setCount(0);
    }
  }, [pathname, prevPathname]);

  // 네비게이션 클릭 감지
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;
      setCount((c) => c + 1);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  const showLoading = useCallback(() => setCount((c) => c + 1), []);
  const hideLoading = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  // 5초 안전장치
  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(0), 5000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {count > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      )}
    </LoadingContext.Provider>
  );
}
