/**
 * Pure localStorage helpers for price alerts.
 * No React — can be called from anywhere.
 */

export interface PriceAlert {
  id: string;
  symbol: string;
  dir: "above" | "below";
  target: number;
  fired: boolean;
}

const STORAGE_KEY = "all24eyez_alerts";

export function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PriceAlert[];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: PriceAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // localStorage unavailable — fail silently
  }
}

/**
 * Returns a new array of alerts that newly crossed their threshold.
 * Does not mutate the input array.
 */
export function checkAlerts(
  alerts: PriceAlert[],
  price: number,
  symbol: string
): PriceAlert[] {
  return alerts.filter((a) => {
    if (a.symbol !== symbol || a.fired) return false;
    return a.dir === "above" ? price >= a.target : price <= a.target;
  });
}
