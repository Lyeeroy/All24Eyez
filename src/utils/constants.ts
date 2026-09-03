/**
 * Color and animation constants for AnimatedPrice and market visualization.
 * Centralized to avoid magic numbers and ensure consistency across UI modules.
 * Dark-only theme.
 */

// Primary color palette (RGB arrays for dynamic interpolation)
export const COLOR_NEUTRAL_DARK_RGB = [232, 228, 220] as const; // #e8e4dc (warm neutral silver)
export const COLOR_NEUTRAL_RGB = COLOR_NEUTRAL_DARK_RGB;

export const COLOR_UP_DARK_RGB = [34, 197, 94] as const; // #22c55e (emerald-500)
export const COLOR_DOWN_DARK_RGB = [239, 68, 68] as const; // #ef4444 (rose-500)

export const COLOR_UP_RGB = COLOR_UP_DARK_RGB;
export const COLOR_DOWN_RGB = COLOR_DOWN_DARK_RGB;

// Currency symbol color
export const COLOR_CURRENCY_SYMBOL_DARK = "#f5d7a4";
export const COLOR_CURRENCY_SYMBOL = COLOR_CURRENCY_SYMBOL_DARK;

// Volatility & Intensity calculation parameters
export const DEFAULT_VOLATILITY_FLOOR = 0.0001; // Minimum expected tick relative change (0.01%)
export const VOLATILITY_24H_DIVISOR = 250; // Factor to convert 24h range into single-tick scale
export const EMA_ALPHA_VOLATILITY = 0.15; // Weight for rolling tick volatility EMA updates

// Intensity thresholds & animations
export const MIN_TICK_INTENSITY = 0.25; // Baseline color tint on any tick move
export const MAX_TICK_INTENSITY = 1.0; // Maximum intensity ceiling for large volatility spikes
export const INTENSITY_DECAY_MS = 1200; // Duration in ms for tick intensity flash to smoothly decay
export const DIGIT_SNAP_DELAY_MS = 620; // Timing for digit strip roll animation snap
