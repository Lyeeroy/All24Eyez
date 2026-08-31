import { createRequire } from "node:module";
import type { SignOptions, Secret } from "jsonwebtoken";
import { parseCookie, stringifySetCookie } from "cookie";
import type { IncomingMessage, ServerResponse } from "node:http";

// jsonwebtoken is CommonJS-only (no ESM entry). Loading it through
// createRequire avoids ESM/CJS interop failures under Vercel's bundler.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");

export interface AuthPayload {
  /** unique user id */
  sub: string;
  /** username (for convenience) */
  username: string;
}

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);

function getSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s || s === "change_me_to_a_long_random_string") {
    throw new Error("JWT_SECRET is not configured");
  }
  return s;
}

export function signToken(payload: AuthPayload): string {
  const opts: SignOptions = { expiresIn: `${SESSION_DAYS}d` };
  return jwt.sign(payload, getSecret(), opts);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "string" || !decoded.sub) return null;
    return {
      sub: String(decoded.sub),
      username: String(decoded.username ?? ""),
    };
  } catch {
    return null;
  }
}

/** Read and verify the auth cookie from an incoming request. */
export function readUser(req: IncomingMessage): AuthPayload | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const cookies = parseCookie(header);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

/** Append the HttpOnly auth cookie to a response. */
export function setAuthCookie(res: ServerResponse, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    })
  );
}

/** Clear the auth cookie. */
export function clearAuthCookie(res: ServerResponse): void {
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({ name: COOKIE_NAME, value: "", ...opts })
  );
}

const HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

/**
 * Write a JSON response with the standard headers. The cookie header is
 * preserved by not overwriting Set-Cookie here.
 */
export function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  for (const [k, v] of Object.entries(HEADERS)) {
    res.setHeader(k, v);
  }
  res.end(JSON.stringify(body));
}

export function jsonError(res: ServerResponse, status: number, message: string): void {
  json(res, status, { error: message });
}
