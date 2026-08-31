import type { IncomingMessage } from "node:http";

const MAX_BODY = 64 * 1024; // 64 KB is plenty for username+password

/**
 * Read and parse a JSON request body. Returns null on malformed JSON or an
 * over-long payload.
 */
export async function readJson<T = Record<string, unknown>>(
  req: IncomingMessage
): Promise<T | null> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_BODY) return null;
    chunks.push(buf);
  }

  if (chunks.length === 0) return null;

  try {
    const text = Buffer.concat(chunks).toString("utf8");
    const parsed = JSON.parse(text);
    return (parsed as T) ?? null;
  } catch {
    return null;
  }
}
