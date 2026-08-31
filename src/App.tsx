import { useState } from "react";
import { AnimatedPrice } from "./components/AnimatedPrice";
import { CryptoSelector } from "./components/CryptoSelector";
import { useBtcPrice, type CryptoSymbol } from "./hooks/useBtcPrice";
import { UserMenu } from "./components/UserMenu";
import { useAlerts } from "./hooks/useAlerts";
import { AlertPanel } from "./components/AlertPanel";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";

function getDecimals(price: number): number {
  if (price >= 1) return 2;
  if (price >= 0.1) return 3;
  if (price >= 0.01) return 5;
  return 8;
}

function fmt(n: number) {
  const decimals = getDecimals(n);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function RangeBar({
  low,
  high,
  price,
  changePct,
}: {
  low: number;
  high: number;
  price: number;
  changePct: number | null;
}) {
  const minLow = Math.min(low, high);
  const maxHigh = Math.max(low, high);
  const span = maxHigh - minLow;
  const raw = span > 0 ? (price - minLow) / span : 0.5;
  const pct = Math.min(1, Math.max(0, raw));

  return (
    <div className="mt-6 w-72 max-w-[80vw]">
      <div className="mb-3 flex items-baseline justify-center gap-2.5">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-faint)]">
          past 24 hours
        </span>
        {changePct !== null && (
          <span
            className={`font-mono text-sm tabular-nums ${
              changePct > 0
                ? "text-emerald-500 dark:text-emerald-400"
                : changePct < 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-[var(--text-muted)]"
            }`}
          >
            {changePct > 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="relative h-px w-full bg-[var(--range-track)]">
        <div
          className="absolute top-1/2 h-px bg-[var(--range-fill)] transition-all duration-500"
          style={{ left: 0, width: `${pct * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--range-thumb)] shadow-[0_0_0_4px_var(--range-thumb-shadow)] transition-all duration-500"
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-xs tabular-nums text-[var(--text-muted)]">
        <span>${fmt(minLow)}</span>
        <span>${fmt(maxHigh)}</span>
      </div>
    </div>
  );
}

function MainDashboard() {
  const [cryptoSymbol, setCryptoSymbol] = useState<CryptoSymbol>("BTCUSDT");
  const {
    price,
    direction,
    change24hPct,
    high24h,
    low24h,
    tickDelta,
    status,
  } = useBtcPrice(cryptoSymbol);
  const { alerts, addAlert, removeAlert } = useAlerts(cryptoSymbol, price);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200">
      <div className="fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 flex items-center justify-between px-4 py-2">
        <CryptoSelector symbol={cryptoSymbol} onSelect={setCryptoSymbol} />
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <AlertPanel
            symbol={cryptoSymbol}
            price={price}
            alerts={alerts}
            onAdd={addAlert}
            onRemove={removeAlert}
          />
          <UserMenu />
        </div>
      </div>

      <main className="flex flex-col items-center gap-6 px-6 pt-16 sm:pt-[calc(2.5rem+env(safe-area-inset-top))]">
        <AnimatedPrice
          price={price}
          direction={direction}
          tickDelta={tickDelta}
          high24h={high24h}
          low24h={low24h}
          change24hPct={change24hPct}
          symbol={cryptoSymbol}
        />

        {low24h !== null && high24h !== null && price !== null && (
          <RangeBar
            low={low24h}
            high={high24h}
            price={price}
            changePct={change24hPct}
          />
        )}

        {status !== "live" && (
          <span className="mt-6 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
            {status === "polling" ? "polling" : status === "error" ? "offline" : "connecting…"}
          </span>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainDashboard />
    </ThemeProvider>
  );
}