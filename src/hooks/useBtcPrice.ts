import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

export type PriceDirection = "up" | "down" | "flat";

export interface BtcPriceState {
  price: number | null;
  direction: PriceDirection;
  change24hPct: number | null;
  change24hUsd: number | null;
  high24h: number | null;
  low24h: number | null;
  tickDelta: number | null;
  status: "connecting" | "live" | "polling" | "error";
  lastUpdate: number | null;
}

const BINANCE_REST =
  "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT";
const BINANCE_WS = "wss://stream.binance.com:9443/ws/btcusdt@ticker";
const COINGECKO =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";

interface Snapshot {
  price: number;
  change24hPct: number | null;
  change24hUsd: number | null;
  high24h: number | null;
  low24h: number | null;
}

function applySnapshot(
  snap: Snapshot,
  setState: Dispatch<SetStateAction<BtcPriceState>>,
  lastPriceRef: MutableRefObject<number | null>
) {
  const prev = lastPriceRef.current;
  let direction: PriceDirection = "flat";
  let tickDelta: number | null = null;

  if (prev !== null && snap.price !== prev) {
    direction = snap.price > prev ? "up" : "down";
    tickDelta = snap.price - prev;
  } else if (prev === null) {
    if (snap.change24hUsd !== null && snap.change24hUsd !== 0) {
      direction = snap.change24hUsd > 0 ? "up" : "down";
    } else if (snap.change24hPct !== null && snap.change24hPct !== 0) {
      direction = snap.change24hPct > 0 ? "up" : "down";
    }
  }

  lastPriceRef.current = snap.price;

  setState((s) => ({
    ...s,
    price: snap.price,
    direction: direction === "flat" ? s.direction : direction,
    change24hPct: snap.change24hPct,
    change24hUsd: snap.change24hUsd,
    high24h: snap.high24h,
    low24h: snap.low24h,
    tickDelta: tickDelta ?? s.tickDelta,
    lastUpdate: Date.now(),
  }));
}

async function fetchBinance(): Promise<Snapshot> {
  const res = await fetch(BINANCE_REST);
  if (!res.ok) throw new Error("binance rest failed");
  const data = await res.json();
  return {
    price: parseFloat(data.lastPrice),
    change24hPct: parseFloat(data.priceChangePercent),
    change24hUsd: parseFloat(data.priceChange),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
  };
}

async function fetchCoinGecko(): Promise<Snapshot> {
  const res = await fetch(COINGECKO);
  if (!res.ok) throw new Error("coingecko failed");
  const data = await res.json();
  return {
    price: data.bitcoin.usd as number,
    change24hPct: data.bitcoin.usd_24h_change as number,
    change24hUsd: null,
    high24h: null,
    low24h: null,
  };
}

async function fetchPrice(): Promise<Snapshot> {
  try {
    return await fetchBinance();
  } catch {
    return await fetchCoinGecko();
  }
}

export function useBtcPrice(): BtcPriceState {
  const [state, setState] = useState<BtcPriceState>({
    price: null,
    direction: "flat",
    change24hPct: null,
    change24hUsd: null,
    high24h: null,
    low24h: null,
    tickDelta: null,
    status: "connecting",
    lastUpdate: null,
  });

  const lastPriceRef = useRef<number | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let backoff = 1000;

    const startPolling = () => {
      if (pollTimer || stopped) return;
      setState((s) => ({ ...s, status: "polling" }));
      const poll = async () => {
        try {
          const snap = await fetchPrice();
          if (!stopped) applySnapshot(snap, setState, lastPriceRef);
        } catch {
          if (!stopped) setState((s) => ({ ...s, status: "error" }));
        }
      };
      void poll();
      pollTimer = setInterval(poll, 3000);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const connectWs = () => {
      if (stopped) return;
      try {
        ws = new WebSocket(BINANCE_WS);
      } catch {
        startPolling();
        return;
      }

      ws.onopen = () => {
        backoff = 1000;
        stopPolling();
        setState((s) => ({ ...s, status: "live" }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          const price = parseFloat(msg.c);
          if (!Number.isFinite(price)) return;
          applySnapshot(
            {
              price,
              change24hPct: parseFloat(msg.P),
              change24hUsd: parseFloat(msg.p),
              high24h: parseFloat(msg.h),
              low24h: parseFloat(msg.l),
            },
            setState,
            lastPriceRef
          );
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onclose = () => {
        if (stopped) return;
        startPolling();
        reconnectTimer = setTimeout(() => {
          if (stopped) return;
          backoff = Math.min(backoff * 1.6, 15000);
          connectWs();
        }, backoff);
      };
    };

    void (async () => {
      try {
        const snap = await fetchPrice();
        if (!stopped) applySnapshot(snap, setState, lastPriceRef);
      } catch {
        if (!stopped) setState((s) => ({ ...s, status: "error" }));
      }
      if (!stopped) connectWs();
    })();

    return () => {
      stopped = true;
      stopPolling();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, []);

  return state;
}
