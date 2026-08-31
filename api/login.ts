import type { IncomingMessage, ServerResponse } from "node:http";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "./lib/mongo.ts";
import { readJson } from "./lib/body.ts";
import { json, jsonError, setAuthCookie, signToken } from "./lib/auth.ts";

interface LoginBody {
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

  const body = await readJson<LoginBody>(req);
  if (!body) {
    return jsonError(res, 400, "Invalid JSON body");
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return jsonError(res, 400, "Username and password are required.");
  }

  try {
    const db = await getDb();
    const users = db.collection<{
      _id: ObjectId;
      username: string;
      passwordHash: string;
    }>("users");

    // Case-insensitive match on username.
    const user = await users.findOne({
      username: { $regex: `^${escapeRegExp(username)}$`, $options: "i" },
    });

    // Perform a dummy compare when the user is missing so timing stays
    // roughly constant and we don't reveal whether the account exists.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      return jsonError(res, 401, "Invalid username or password.");
    }

    const id = user._id.toString();
    const token = signToken({ sub: id, username: user.username });
    setAuthCookie(res, token);

    return json(res, 200, {
      user: { id, username: user.username },
    });
  } catch (err) {
    console.error("login failed", err);
    return jsonError(res, 500, "Something went wrong. Please try again.");
  }
}

// A valid-placeholder bcrypt hash so missing users take ~the same time as
// present users (timing-side-channel mitigation).
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO6QwQzG0Z1v3f8dR5lH9mXfB7nY9zK0W";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
