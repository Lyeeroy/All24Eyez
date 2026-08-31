import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __mongoPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "ttd_auto";

function connect(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  const client = new MongoClient(uri, {
    maxPoolSize: 1,
    minPoolSize: 0,
    // Explicit TLS + Stable API required by MongoDB Atlas from serverless runtimes
    // (the driver's SRV-based TLS inference can fail in Lambda without these).
    tls: true,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  return client.connect();
}

/**
 * Returns a shared Mongo client. On Vercel we cache the connection on the
 * global object so it is reused across warm serverless invocations, which
 * avoids opening a new socket for every request.
 */
export function getClient(): Promise<MongoClient> {
  if (!global.__mongoPromise) {
    global.__mongoPromise = connect();
  }
  return global.__mongoPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(dbName);
}

export async function withMongoGuard() {
  // Exists purely so callers that need to gracefully handle Mongo being
  // unavailable can catch a concrete error rather than a generic one.
  await getClient();
}
