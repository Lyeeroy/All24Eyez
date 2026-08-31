import {
  DEFAULT_VOLATILITY_FLOOR,
  VOLATILITY_24H_DIVISOR,
  EMA_ALPHA_VOLATILITY,
  MIN_TICK_INTENSITY,
  MAX_TICK_INTENSITY,
} from "./constants";

export interface VolatilityTracker {
  rollingVol: number;
}

/**
 * Creates a fresh volatility tracking state instance.
 */
export function createVolatilityTracker(): VolatilityTracker {
  return {
    rollingVol: DEFAULT_VOLATILITY_FLOOR,
  };
}

/**
 * Calculates current market volatility scale.
 * Combines 24h price range and rolling tick move magnitude so that coloring
 * intensity adapts dynamically on quiet (low-vol) vs fast (high-vol) market days.
 */
export function calculateCurrentVolatility(
  tracker: VolatilityTracker,
  pctMove: number,
  price: number | null,
  high24h?: number | null,
  low24h?: number | null,
  change24hPct?: number | null
): number {
  // Update rolling tick volatility EMA whenever price moves
  if (pctMove > 0) {
    tracker.rollingVol =
      EMA_ALPHA_VOLATILITY * pctMove +
      (1 - EMA_ALPHA_VOLATILITY) * tracker.rollingVol;
  }

  // Derive 24h range volatility percentage when 24h metrics are available
  let vol24h = 0;
  if (price && price > 0 && high24h != null && low24h != null && high24h > low24h) {
    vol24h = (high24h - low24h) / price;
  } else if (change24hPct != null && change24hPct !== 0) {
    vol24h = Math.abs(change24hPct) / 100;
  }

  // Scale 24h range volatility into an expected per-tick scale
  const vol24hTickScale = vol24h / VOLATILITY_24H_DIVISOR;

  // Adaptive benchmark is the maximum of rolling tick vol, 24h scale, and absolute floor
  return Math.max(DEFAULT_VOLATILITY_FLOOR, tracker.rollingVol, vol24hTickScale);
}

/**
 * Maps a tick's percentage move relative to current volatility into a normalized color intensity.
 */
export function calculateTickIntensity(
  pctMove: number,
  currentVolatility: number
): number {
  if (pctMove <= 0 || currentVolatility <= 0) {
    return MIN_TICK_INTENSITY;
  }

  // Measure tick move relative to the expected market volatility scale
  const relativeMagnitude = pctMove / currentVolatility;

  // Scale relative magnitude into intensity window (MIN_TICK_INTENSITY to MAX_TICK_INTENSITY)
  const scaled = MIN_TICK_INTENSITY + relativeMagnitude * 0.35;
  return Math.min(MAX_TICK_INTENSITY, Math.max(MIN_TICK_INTENSITY, scaled));
}
