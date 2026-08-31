import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import type { PriceDirection } from "../hooks/useBtcPrice";

const STRIP_START = -12;
const STRIP_END = 22;
const STRIP: number[] = [];
for (let i = STRIP_START; i <= STRIP_END; i++) {
  STRIP.push(((i % 10) + 10) % 10);
}

function AnimatedDigit({
  digit,
  direction,
  ready,
}: {
  digit: number;
  direction: PriceDirection;
  ready: boolean;
}) {
  const [shift, setShift] = useState(digit);
  const [instant, setInstant] = useState(true);
  const prevRef = useRef(digit);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const from = prevRef.current;
    const to = digit;
    if (from === to) return;
    prevRef.current = to;

    if (!ready) {
      setInstant(true);
      setShift(to);
      return;
    }

    if (snapTimer.current) clearTimeout(snapTimer.current);

    let dist: number;
    if (direction === "down") {
      dist = -((from - to + 10) % 10);
      if (dist === 0) dist = -10;
    } else {
      dist = (to - from + 10) % 10;
      if (dist === 0) dist = 10;
    }

    setInstant(false);
    setShift((s) => {
      const normalized = ((s % 10) + 10) % 10;
      return normalized + dist;
    });

    snapTimer.current = setTimeout(() => {
      setInstant(true);
      setShift(to);
    }, 620);

    return () => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, [digit, direction, ready]);

  return (
    <span className="digit-window relative inline-block h-[1em] w-[0.62em] overflow-hidden align-baseline">
      <span
        className={cn(
          "absolute left-0 top-0 flex w-full flex-col items-center",
          !instant && "digit-roll"
        )}
        style={{ transform: `translateY(${-(shift - STRIP_START)}em)` }}
      >
        {STRIP.map((n, i) => (
          <span
            key={i}
            className="flex h-[1em] w-full items-center justify-center"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function getDecimals(price: number): number {
  if (price >= 1) return 2;
  if (price >= 0.1) return 3;
  if (price >= 0.01) return 5;
  return 8;
}

function formatParts(price: number) {
  const decimals = getDecimals(price);
  return price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AnimatedPrice({
  price,
  direction,
  tickDelta,
  symbol,
}: {
  price: number | null;
  direction: PriceDirection;
  tickDelta?: number | null;
  symbol: string;
}) {
  const [ready, setReady] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const first = useRef(true);
  const recentMoves = useRef<number[]>([]);
  const prevSymbol = useRef(symbol);

  useEffect(() => {
    if (symbol !== prevSymbol.current) {
      prevSymbol.current = symbol;
      recentMoves.current = [];
    }
  }, [symbol]);

  useEffect(() => {
    if (price !== null && first.current) {
      first.current = false;
      const t = setTimeout(() => setReady(true), 80);
      return () => clearTimeout(t);
    }
  }, [price]);

  useEffect(() => {
    if (tickDelta === null || tickDelta === undefined || tickDelta === 0) return;

    const move = Math.abs(tickDelta);
    const history = recentMoves.current;
    history.push(move);
    if (history.length > 60) history.shift();

    // Compare this move with the recent market instead of a fixed dollar amount.
    const sorted = [...history].sort((a, b) => a - b);
    const typical = sorted[Math.floor((sorted.length - 1) * 0.75)] || move;
    setIntensity(Math.min(1, move / Math.max(typical, Number.EPSILON)));
  }, [price, tickDelta]);

  const norm = intensity;
  const neutral = [232, 228, 220];
  const target = direction === "down" ? [248, 113, 113] : [74, 222, 128];
  const blend = (channel: number) =>
    Math.round(neutral[channel] + (target[channel] - neutral[channel]) * norm);
  const movementColor = `rgb(${blend(0)}, ${blend(1)}, ${blend(2)})`;


  if (price === null) {
    return (
      <div className="flex items-end gap-2 font-mono text-[clamp(2.6rem,11vw,7.2rem)] font-medium leading-none tracking-tight text-white/20">
        <span className="mb-[0.28em] mr-1 font-sans text-[0.32em] font-light text-white/25">
          $
        </span>
        <span className="animate-pulse">--,---.--</span>
      </div>
    );
  }

  const parts = formatParts(price);

  return (
    <div
      className={cn(
        "flex items-end gap-1 font-mono text-[clamp(2.6rem,11vw,7.2rem)] font-medium leading-none tracking-tight transition-colors duration-300"
      )}
      style={{ color: movementColor }}
    >
      <span className="mb-[0.28em] mr-[0.12em] font-sans text-[0.32em] font-light text-[#f5d7a4]/70">
        $
      </span>
      {parts.split("").map((ch, i) => {
        if (ch === "," || ch === ".") {
          return (
            <span
              key={`${ch}-${i}`}
              className={cn(
                "inline-block",
                ch === "," ? "w-[0.38em] text-center" : "w-[0.34em] text-center"
              )}
              style={{ opacity: 0.55 }}
            >
              {ch}
            </span>
          );
        }
        return (
          <AnimatedDigit
            key={`d-${i}-${parts.length}`}
            digit={Number(ch)}
            direction={direction}
            ready={ready}
          />
        );
      })}

      {/* Arrow next to number */}
      {direction !== "flat" && (
        <span
          className="arrow-pop mb-[0.42em] ml-[0.18em] inline-block h-[0.62em] w-[0.7em]"
          style={{
            color: movementColor,
          }}
        >
          {direction === "up" ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
              <path d="M12 4.5l8.2 10.4c.52.66.03 1.6-.82 1.6H4.62c-.85 0-1.34-.94-.82-1.6z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
              <path d="M12 19.5L3.8 9.1c-.52-.66-.03-1.6.82-1.6h14.76c.85 0 1.34.94.82 1.6z" />
            </svg>
          )}
        </span>
      )}
    </div>
  );
}
