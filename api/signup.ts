import type { IncomingMessage, ServerResponse } from "node:http";
import bcrypt from "bcryptjs";
import { getDb } from "./lib/mongo.ts";
import { readJson } from "./lib/body.ts";
import { json, jsonError, setAuthCookie, signToken } from "./lib/auth.ts";
import { validateCredentials } from "./lib/validate.ts";

const BCRYPT_ROUNDS = 12;

interface SignupBody {
  username?: unknown;
  password?: unknown;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    return jsonError(res, 405, "Method not allowed");
  }

  const body = await readJson<SignupBody>(req);
  if (!body) {
    return jsonError(res, 400, "Invalid JSON body");
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const check = validateCredentials(username, password);
  if (!check.ok) {
    return jsonError(res, 400, check.message);
  }

  try {
    const db = await getDb();
    const users = db.collection<{ username: string; passwordHash: string; createdAt: Date }>(
      "users"
    );

    const existing = await users.findOne({
      username: { $regex: `^${escapeRegExp(username)}$`, $options: "i" },
    });
    if (existing) {
      return jsonError(
        res,
        409,
        "That username is already taken. Try another one."
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date();
    const result = await users.insertOne({
      username,
      passwordHash,
      createdAt: now,
    });

    const token = signToken({ sub: result.insertedId.toHexString(), username });
    setAuthCookie(res, token);

    return json(res, 201, {
      user: { id: result.insertedId.toHexString(), username },
    });
  } catch (err) {
    console.error("signup failed", err);
    return jsonError(res, 500, "Something went wrong. Please try again.");
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
