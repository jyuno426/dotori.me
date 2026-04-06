"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";

const ASSET_CLASS_LABELS: Record<string, string> = {
  domestic_equity: "국내 주식",
  foreign_equity: "해외",
  bond: "채권",
  alternative: "대안",
};

interface Security {
  ticker: string;
  name: string;
  market: string;
  assetClass: string | null;
  category: string;
}

interface Props {
  onSelect: (security: { ticker: string; name: string; assetClass: string }) => void;
  placeholder?: string;
}

export function SecuritySearch({ onSelect, placeholder = "종목명 또는 코드 검색" }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Security[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 디바운스 검색
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/securities/search?q=${encodeURIComponent(query.trim())}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(sec: Security) {
    onSelect({
      ticker: sec.ticker,
      name: sec.name,
      assetClass: sec.assetClass || "domestic_equity",
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-surface-dim pl-9 pr-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 animate-spin"
          />
        )}
      </div>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-dim bg-surface shadow-lg max-h-60 overflow-y-auto">
          {results.map((sec, i) => (
            <button
              key={sec.ticker}
              type="button"
              onClick={() => handleSelect(sec)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-surface-dim/50 transition-colors ${
                i === selectedIndex ? "bg-surface-dim/50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{sec.name}</span>
                <span className="text-xs text-foreground/50 font-mono ml-1.5">{sec.ticker}</span>
              </div>
              {sec.assetClass && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-dim text-foreground/50">
                  {ASSET_CLASS_LABELS[sec.assetClass] || sec.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-dim bg-surface shadow-lg p-3">
          <p className="text-sm text-foreground/50 text-center">검색 결과 없음</p>
        </div>
      )}
    </div>
  );
}
