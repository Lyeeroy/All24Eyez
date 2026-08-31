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

export const CRYPTOS = [
  { name: "bitcoin", symbol: "BTCUSDT" },
  { name: "ethereum", symbol: "ETHUSDT" },
  { name: "solana", symbol: "SOLUSDT" },
  { name: "bnb", symbol: "BNBUSDT" },
  { name: "xrp", symbol: "XRPUSDT" },
  { name: "cardano", symbol: "ADAUSDT" },
  { name: "avalanche", symbol: "AVAXUSDT" },
  { name: "dogecoin", symbol: "DOGEUSDT" },
  { name: "polkadot", symbol: "DOTUSDT" },
  { name: "polygon", symbol: "MATICUSDT" },
] as const;

export type CryptoSymbol = typeof CRYPTOS[number]["symbol"];

const SYMBOL_TO_COINGECKO: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binance-coin",
  XRPUSDT: "ripple",
  ADAUSDT: "cardano",
  AVAXUSDT: "avalanche-2",
  DOGEUSDT: "dogecoin",
  DOTUSDT: "polkadot",
  MATICUSDT: "polygon",
};

const BINANCE_REST = (symbol: string) =>
  `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
const BINANCE_WS = (symbol: string) =>
  `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
const COINGECKO = (id: string) =>
  `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`;

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

async function fetchBinance(symbol: string): Promise<Snapshot> {
  const res = await fetch(BINANCE_REST(symbol));
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

async function fetchCoinGecko(symbol: string): Promise<Snapshot> {
  const id = SYMBOL_TO_COINGECKO[symbol] || symbol.toLowerCase();
  const res = await fetch(COINGECKO(id));
  if (!res.ok) throw new Error("coingecko failed");
  const data = await res.json();
  const key = id as keyof typeof data;
  return {
    price: data[key]?.usd as number,
    change24hPct: data[key]?.usd_24h_change as number,
    change24hUsd: null,
    high24h: null,
    low24h: null,
  };
}

async function fetchPrice(symbol: string): Promise<Snapshot> {
  try {
    return await fetchBinance(symbol);
  } catch {
    return await fetchCoinGecko(symbol);
  }
}

export function useBtcPrice(symbol: string = "BTCUSDT"): BtcPriceState {
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
    lastPriceRef.current = null;
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
          const snap = await fetchPrice(symbol);
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
        ws = new WebSocket(BINANCE_WS(symbol));
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
        const snap = await fetchPrice(symbol);
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
  }, [symbol]);

  return state;
}