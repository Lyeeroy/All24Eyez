import { useState } from "react";
import { AnimatedPrice } from "./components/AnimatedPrice";
import { CryptoSelector } from "./components/CryptoSelector";
import { useBtcPrice, type CryptoSymbol } from "./hooks/useBtcPrice";
import { UserMenu } from "./components/UserMenu";

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  const span = high - low;
  const raw = span > 0 ? (price - low) / span : 0.5;
  const pct = Math.min(1, Math.max(0, raw));

  return (
    <div className="mt-6 w-72 max-w-[80vw]">
      <div className="mb-3 flex items-baseline justify-center gap-2.5">
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
          past 24 hours
        </span>
        {changePct !== null && (
          <span
            className={`font-mono text-sm tabular-nums ${
              changePct > 0
                ? "text-emerald-400"
                : changePct < 0
                  ? "text-rose-400"
                  : "text-white/60"
            }`}
          >
            {changePct > 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="relative h-px w-full bg-white/15">
        <div
          className="absolute top-1/2 h-px bg-white/40 transition-all duration-500"
          style={{ left: 0, width: `${pct * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8e4dc] shadow-[0_0_0_4px_rgba(232,228,220,0.12)] transition-all duration-500"
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-xs tabular-nums text-white/35">
        <span>${fmt(low)}</span>
        <span>${fmt(high)}</span>
      </div>
    </div>
  );
}

export default function App() {
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] text-[#e8e4dc]">
      <div className="fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 flex items-center justify-between px-4 py-2">
        <CryptoSelector symbol={cryptoSymbol} onSelect={setCryptoSymbol} />
        <UserMenu />
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
          <span className="mt-6 text-[10px] uppercase tracking-widest text-white/20">
            {status === "polling" ? "polling" : status === "error" ? "offline" : "connecting…"}
          </span>
        )}
      </main>
    </div>
  );
}