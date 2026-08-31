import type { IncomingMessage, ServerResponse } from "node:http";
import { clearAuthCookie, json } from "./lib/auth.ts";

export default async function handler(
  _req: IncomingMessage,
  res: ServerResponse
) {
  // Idempotent: always clear, regardless of method.
  clearAuthCookie(res);
  return json(res, 200, { ok: true });
}
