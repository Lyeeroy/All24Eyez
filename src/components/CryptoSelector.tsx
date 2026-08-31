import { useState, useRef, useEffect, useMemo } from "react";
import { CRYPTOS, type CryptoSymbol } from "../hooks/useBtcPrice";

export function CryptoSelector({
  symbol,
  onSelect,
}: {
  symbol: CryptoSymbol;
  onSelect: (symbol: CryptoSymbol) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const current = CRYPTOS.find((c) => c.symbol === symbol) ?? CRYPTOS[0];

  const filtered = useMemo(() => {
    if (!input.trim()) return CRYPTOS;
    const q = input.toLowerCase();
    return CRYPTOS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [input]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none touch-manipulation min-h-[44px]"
        onClick={() => setOpen(!open)}
      >
        <span className="font-mono text-sm tracking-wide text-[#f5d7a4]/90 hover:text-[#f5d7a4] transition-colors sm:text-base">
          {current.name}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 text-[#f5d7a4]/70 transition-transform duration-200 sm:h-5 sm:w-5 ${open ? "rotate-180" : ""}`}
          style={{ color: "inherit" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 flex flex-col gap-1.5 sm:mt-3">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search crypto..."
            className="w-56 rounded-md border border-white/10 bg-[#141414] px-3 py-2 font-mono text-sm text-[#e8e4dc] placeholder:text-white/25 outline-none focus:border-[#f5d7a4]/40 sm:w-64 sm:text-base sm:py-2.5"
          />
          <div className="crypto-dropdown max-h-48 w-56 overflow-y-auto rounded-md border border-white/10 bg-[#141414] py-1 shadow-xl sm:w-64 sm:max-h-56">
            {filtered.length === 0 ? (
              <span className="block px-3 py-2 font-mono text-xs text-white/25 sm:text-sm">
                Not found
              </span>
            ) : (
              filtered.map((c) => {
                const isSelected = c.symbol === symbol;
                return (
                  <div
                    key={c.symbol}
                    className={`cursor-pointer px-3 py-2 font-mono text-sm transition-colors sm:py-2.5 sm:text-base ${
                      isSelected
                        ? "text-[#f5d7a4] bg-white/5"
                        : "text-[#e8e4dc]/80 hover:text-[#f5d7a4] hover:bg-white/5"
                    }`}
                    onClick={() => {
                      onSelect(c.symbol as CryptoSymbol);
                      setOpen(false);
                      setInput("");
                    }}
                  >
                    <span className="capitalize">{c.name}</span>
                    <span className="ml-2 text-white/25">{c.symbol}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}