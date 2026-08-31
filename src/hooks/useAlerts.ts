import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkAlerts,
  loadAlerts,
  saveAlerts,
  type PriceAlert,
} from "../utils/alerts";

export interface UseAlertsReturn {
  alerts: PriceAlert[];
  addAlert: (dir: "above" | "below", target: number) => void;
  removeAlert: (id: string) => void;
}

export function useAlerts(symbol: string, price: number | null): UseAlertsReturn {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadAlerts());
  // Track which alert IDs have auto-removal timers to avoid duplicates
  const removalTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Persist to localStorage whenever alerts change
  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  // Check alert thresholds on every price tick
  useEffect(() => {
    if (price === null) return;

    const triggered = checkAlerts(alerts, price, symbol);
    if (triggered.length === 0) return;

    const triggeredIds = new Set(triggered.map((a) => a.id));

    // Mark as fired
    setAlerts((prev) =>
      prev.map((a) => (triggeredIds.has(a.id) ? { ...a, fired: true } : a))
    );

    // Fire browser notifications
    triggered.forEach((a) => {
      const label = a.dir === "above" ? "above" : "below";
      const formatted = a.target.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      if (Notification.permission === "granted") {
        new Notification(`${symbol} ${label} $${formatted}`, {
          body: `Price is now $${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: "/favicon.ico",
          tag: a.id,
        });
      }

      // Auto-remove fired alert after 10 seconds if not already queued
      if (!removalTimers.current[a.id]) {
        removalTimers.current[a.id] = setTimeout(() => {
          setAlerts((prev) => prev.filter((x) => x.id !== a.id));
          delete removalTimers.current[a.id];
        }, 10_000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const addAlert = useCallback(
    (dir: "above" | "below", target: number) => {
      const newAlert: PriceAlert = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        symbol,
        dir,
        target,
        fired: false,
      };
      setAlerts((prev) => [...prev, newAlert]);
    },
    [symbol]
  );

  const removeAlert = useCallback((id: string) => {
    // Cancel any pending auto-removal
    if (removalTimers.current[id]) {
      clearTimeout(removalTimers.current[id]);
      delete removalTimers.current[id];
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Clear removal timers on unmount
  useEffect(() => {
    return () => {
      Object.values(removalTimers.current).forEach(clearTimeout);
    };
  }, []);

  return { alerts, addAlert, removeAlert };
}
