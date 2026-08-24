import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
  __mongoClientPromise?: Promise<MongoClient>;
};

let cachedClientPromise: Promise<MongoClient> | null = null;

function getClientPromise() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  if (process.env.NODE_ENV === "development") {
    if (!globalForMongo.__mongoClientPromise) {
      const client = new MongoClient(mongoUri);
      globalForMongo.__mongoClientPromise = client.connect();
    }

    return globalForMongo.__mongoClientPromise;
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(mongoUri);

    cachedClientPromise = client.connect();
  }

  return cachedClientPromise;
}

export async function getMongoClient() {
  return getClientPromise();
}

export async function getMongoDb() {
  const connected = await getMongoClient();

  const dbName = process.env.MONGODB_DB;
  return dbName ? connected.db(dbName) : connected.db();
}
