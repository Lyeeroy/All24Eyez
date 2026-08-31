/**
 * Color and animation constants for AnimatedPrice and market visualization.
 * Centralized to avoid magic numbers and ensure consistency across UI modules.
 */

// Primary color palettes (RGB arrays for dynamic interpolation)
export const COLOR_NEUTRAL_RGB = [232, 228, 220] as const; // #e8e4dc (warm neutral silver)
export const COLOR_UP_RGB = [34, 197, 94] as const;       // Emerald green
export const COLOR_DOWN_RGB = [239, 68, 68] as const;     // Vivid rose red

// Currency symbol color
export const COLOR_CURRENCY_SYMBOL = "#f5d7a4";

// Volatility & Intensity calculation parameters
export const DEFAULT_VOLATILITY_FLOOR = 0.0001; // Minimum expected tick relative change (0.01%)
export const VOLATILITY_24H_DIVISOR = 250;      // Factor to convert 24h range into single-tick scale
export const EMA_ALPHA_VOLATILITY = 0.15;        // Weight for rolling tick volatility EMA updates

// Intensity thresholds & animations
export const MIN_TICK_INTENSITY = 0.25;  // Baseline color tint on any tick move
export const MAX_TICK_INTENSITY = 1.0;   // Maximum intensity ceiling for large volatility spikes
export const INTENSITY_DECAY_MS = 1200;  // Duration in ms for tick intensity flash to smoothly decay
export const DIGIT_SNAP_DELAY_MS = 620;  // Timing for digit strip roll animation snap
