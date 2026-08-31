import type { IncomingMessage, ServerResponse } from "node:http";
import { ObjectId } from "mongodb";
import { getDb } from "./lib/mongo.js";
import { json, jsonError, readUser } from "./lib/auth.js";

interface UserDoc {
  _id: ObjectId;
  username: string;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "GET") {
    return jsonError(res, 405, "Method not allowed");
  }

  const payload = readUser(req);
  if (!payload) {
    return jsonError(res, 401, "Not authenticated");
  }

  try {
    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    let user: UserDoc | null = null;

    if (ObjectId.isValid(payload.sub)) {
      user = await users.findOne({ _id: new ObjectId(payload.sub) });
    }

    if (!user) {
      return jsonError(res, 401, "Not authenticated");
    }

    return json(res, 200, {
      user: { id: user._id.toString(), username: user.username },
    });
  } catch (err) {
    console.error("me failed", err);
    return jsonError(res, 500, "Something went wrong. Please try again.");
  }
}
