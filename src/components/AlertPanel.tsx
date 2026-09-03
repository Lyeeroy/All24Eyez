import { useEffect, useRef, useState } from "react";
import type { PriceAlert } from "../utils/alerts";
import { CRYPTOS } from "../hooks/useBtcPrice";

interface AlertPanelProps {
  symbol: string;
  price: number | null;
  alerts: PriceAlert[];
  onAdd: (dir: "above" | "below", target: number) => void;
  onRemove: (id: string) => void;
}

function BellIcon({ hasBadge }: { hasBadge: boolean }) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {hasBadge && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0a0a0a]" />
      )}
    </div>
  );
}

export function AlertPanel({
  symbol,
  price,
  alerts,
  onAdd,
  onRemove,
}: AlertPanelProps) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<"above" | "below">("above");
  const [targetInput, setTargetInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const symbolAlerts = alerts.filter((a) => a.symbol === symbol);
  const hasBadge = symbolAlerts.some((a) => !a.fired);
  const coinName = CRYPTOS.find((c) => c.symbol === symbol)?.name ?? symbol;

  // Pre-fill target with current price when opening
  useEffect(() => {
    if (open && price !== null) {
      setTargetInput(price.toFixed(2));
    }
  }, [open, price]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  async function handleAdd() {
    const parsed = parseFloat(targetInput.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputError(true);
      setTimeout(() => setInputError(false), 600);
      return;
    }

    // Request notification permission on first add
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    onAdd(dir, parsed);
    setTargetInput(price !== null ? price.toFixed(2) : "");
  }

  function formatTarget(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-accent)] touch-manipulation"
        aria-label="Price alerts"
      >
        <BellIcon hasBadge={hasBadge} />
      </button>

      {/* Panel */}
      {open && (
        <div className="alert-panel absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-3 shadow-[var(--panel-shadow)] sm:w-72">
          {/* Header */}
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Alert for <span className="text-[var(--text-accent)]">{coinName}</span>
          </p>

          {/* Input row */}
          <div className="flex items-center gap-2">
            {/* Above / Below toggle */}
            <div className="flex rounded-md border border-[var(--border-subtle)] overflow-hidden text-[11px] font-mono">
              <button
                className={`px-2 py-1.5 transition-colors ${dir === "above" ? "bg-white/10 text-[var(--text-main)] font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                onClick={() => setDir("above")}
              >
                ↑
              </button>
              <button
                className={`px-2 py-1.5 transition-colors ${dir === "below" ? "bg-white/10 text-[var(--text-main)] font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                onClick={() => setDir("below")}
              >
                ↓
              </button>
            </div>

            {/* Price input */}
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
              placeholder="Target price"
              className={`min-w-0 flex-1 rounded-md border bg-[var(--bg-input)] px-2 py-1.5 font-mono text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-faint)] transition-colors ${
                inputError ? "border-rose-500" : "border-[var(--border-subtle)] focus:border-[var(--text-accent)]"
              }`}
            />

            {/* Add button */}
            <button
              onClick={() => void handleAdd()}
              className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-accent)] opacity-90 transition-opacity hover:opacity-100 hover:border-[var(--text-accent)]"
            >
              Add
            </button>
          </div>

          {/* Alert list */}
          {symbolAlerts.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-[var(--border-subtle)] pt-3">
              {symbolAlerts.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 transition-colors ${
                    a.fired
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "bg-white/5"
                  }`}
                >
                  <span className={`font-mono text-xs tabular-nums ${a.fired ? "text-amber-400 font-semibold" : "text-[var(--text-muted)]"}`}>
                    {a.dir === "above" ? "↑" : "↓"}{" "}
                    <span className="text-[var(--text-main)]">${formatTarget(a.target)}</span>
                    {a.fired && (
                      <span className="ml-1.5 text-[10px] text-amber-400/70">fired!</span>
                    )}
                  </span>
                  <button
                    onClick={() => onRemove(a.id)}
                    className="ml-2 text-[var(--text-faint)] transition-colors hover:text-rose-500"
                    aria-label="Remove alert"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {symbolAlerts.length === 0 && (
            <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 font-mono text-[10px] text-[var(--text-faint)]">
              No alerts set for {coinName}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
