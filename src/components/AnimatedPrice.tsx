import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import type { PriceDirection } from "../hooks/useBtcPrice";
import { useTheme } from "../hooks/useTheme";
import {
  COLOR_NEUTRAL_DARK_RGB,
  COLOR_NEUTRAL_LIGHT_RGB,
  COLOR_UP_DARK_RGB,
  COLOR_DOWN_DARK_RGB,
  COLOR_UP_LIGHT_RGB,
  COLOR_DOWN_LIGHT_RGB,
  COLOR_CURRENCY_SYMBOL_DARK,
  COLOR_CURRENCY_SYMBOL_LIGHT,
  INTENSITY_DECAY_MS,
  DIGIT_SNAP_DELAY_MS,
} from "../utils/constants";
import {
  createVolatilityTracker,
  calculateCurrentVolatility,
  calculateTickIntensity,
  type VolatilityTracker,
} from "../utils/volatility";

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
  const [instant, setInstant] = useState(false);
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

    // Ensure transition is active before shift update
    setInstant(false);

    // Update shift relative to current position so rolling animation triggers immediately
    setShift((currentShift) => {
      const base = ((currentShift % 10) + 10) % 10;
      return base + dist;
    });

    // After roll animation completes, snap shift back to normalized target invisibly
    snapTimer.current = setTimeout(() => {
      setInstant(true);
      setShift(to);
      requestAnimationFrame(() => {
        setInstant(false);
      });
    }, DIGIT_SNAP_DELAY_MS);

    return () => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, [digit, direction, ready]);

  return (
    <span className="digit-window relative inline-block h-[1em] w-[0.62em] overflow-hidden align-baseline">
      <span
        className={cn(
          "absolute left-0 top-0 flex w-full flex-col items-center",
          !instant && "digit-roll",
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

export interface AnimatedPriceProps {
  price: number | null;
  direction: PriceDirection;
  tickDelta?: number | null;
  high24h?: number | null;
  low24h?: number | null;
  change24hPct?: number | null;
  symbol: string;
}

export function AnimatedPrice({
  price,
  direction,
  tickDelta,
  high24h,
  low24h,
  change24hPct,
  symbol,
}: AnimatedPriceProps) {
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const first = useRef(true);
  const volTrackerRef = useRef<VolatilityTracker>(createVolatilityTracker());
  const decayRef = useRef<number | null>(null);
  const prevSymbolRef = useRef<string>(symbol);

  const isDark = resolvedTheme === "dark";

  // Select neutral RGB, directional colors, and currency symbol color based on active theme
  const neutralRgb = isDark ? COLOR_NEUTRAL_DARK_RGB : COLOR_NEUTRAL_LIGHT_RGB;

  const upColor = isDark ? COLOR_UP_DARK_RGB : COLOR_UP_LIGHT_RGB;
  const downColor = isDark ? COLOR_DOWN_DARK_RGB : COLOR_DOWN_LIGHT_RGB;

  const currencySymbolColor = isDark
    ? COLOR_CURRENCY_SYMBOL_DARK
    : COLOR_CURRENCY_SYMBOL_LIGHT;

  // Reset tracker state when active crypto symbol changes
  useEffect(() => {
    if (prevSymbolRef.current !== symbol) {
      prevSymbolRef.current = symbol;
      volTrackerRef.current = createVolatilityTracker();
      setIntensity(0);
    }
  }, [symbol]);

  useEffect(() => {
    if (price !== null && first.current) {
      first.current = false;
      const t = setTimeout(() => setReady(true), 80);
      return () => clearTimeout(t);
    }
  }, [price]);

  // Recalculate volatility and adapt color intensity whenever a price tick arrives
  useEffect(() => {
    if (
      tickDelta === null ||
      tickDelta === undefined ||
      tickDelta === 0 ||
      price === null ||
      price <= 0
    ) {
      return;
    }

    const move = Math.abs(tickDelta);
    const pctMove = move / price;

    // Calculate current market volatility benchmark
    const currentVol = calculateCurrentVolatility(
      volTrackerRef.current,
      pctMove,
      price,
      high24h,
      low24h,
      change24hPct,
    );

    // Derive tick intensity relative to current market volatility scale
    const targetIntensity = calculateTickIntensity(pctMove, currentVol);

    // Cancel existing decay animation frame if running
    if (decayRef.current !== null) {
      cancelAnimationFrame(decayRef.current);
    }

    const startTime = performance.now();

    // Start smoothly from peak intensity, blending seamlessly if a new tick arrives mid-decay
    setIntensity((prevIntensity) => {
      const startIntensity = Math.max(prevIntensity * 0.85, targetIntensity);

      const animateDecay = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / INTENSITY_DECAY_MS);

        // Cubic ease-out decay for silky smooth decoloring that lands gracefully at 0
        const current = startIntensity * Math.pow(1 - progress, 1);

        setIntensity(current);

        if (progress < 1) {
          decayRef.current = requestAnimationFrame(animateDecay);
        } else {
          setIntensity(0);
          decayRef.current = null;
        }
      };

      decayRef.current = requestAnimationFrame(animateDecay);
      return startIntensity;
    });

    return () => {
      if (decayRef.current !== null) {
        cancelAnimationFrame(decayRef.current);
      }
    };
  }, [tickDelta, price, high24h, low24h, change24hPct]);

  // Calculate RGB color transition based on direction and intensity
  const targetColor = direction === "down" ? downColor : upColor;

  const blend = (channel: number) =>
    Math.round(
      neutralRgb[channel] +
        (targetColor[channel] - neutralRgb[channel]) * intensity,
    );

  const movementColor = `rgb(${blend(0)}, ${blend(1)}, ${blend(2)})`;

  // Compute glowing drop shadow effect matching current move intensity (dark mode only for clarity)
  const glowColor =
    direction === "down"
      ? `rgba(${downColor.join(",")}, ${(intensity * 0.4).toFixed(2)})`
      : `rgba(${upColor.join(",")}, ${(intensity * 0.4).toFixed(2)})`;

  const textShadow =
    isDark && intensity > 0.05
      ? `0 0 ${(intensity * 16).toFixed(1)}px ${glowColor}`
      : "none";

  if (price === null) {
    return (
      <div className="flex items-end gap-2 font-mono text-[clamp(2.6rem,11vw,7.2rem)] font-medium leading-none tracking-tight text-[var(--text-faint)]">
        <span className="mb-[0.28em] mr-1 font-sans text-[0.32em] font-light opacity-60">
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
        "flex items-end gap-1 font-mono text-[clamp(2.6rem,11vw,7.2rem)] font-medium leading-none tracking-tight",
      )}
      style={{
        color: movementColor,
        textShadow,
      }}
    >
      <span
        className="mb-[0.28em] mr-[0.12em] font-sans text-[0.32em] font-light opacity-90 transition-opacity"
        style={{ color: currencySymbolColor }}
      >
        $
      </span>
      {parts.split("").map((ch, i) => {
        if (ch === "," || ch === ".") {
          return (
            <span
              key={`${ch}-${i}`}
              className={cn(
                "inline-block",
                ch === ","
                  ? "w-[0.38em] text-center"
                  : "w-[0.34em] text-center",
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

      {/* Direction Arrow */}
      {direction !== "flat" && (
        <span
          className="arrow-pop mb-[0.42em] ml-[0.18em] inline-block h-[0.62em] w-[0.7em]"
          style={{
            color: movementColor,
          }}
        >
          {direction === "up" ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-full w-full"
            >
              <path d="M12 4.5l8.2 10.4c.52.66.03 1.6-.82 1.6H4.62c-.85 0-1.34-.94-.82-1.6z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-full w-full"
            >
              <path d="M12 19.5L3.8 9.1c-.52-.66-.03-1.6.82-1.6h14.76c.85 0 1.34.94.82 1.6z" />
            </svg>
          )}
        </span>
      )}
    </div>
  );
}
