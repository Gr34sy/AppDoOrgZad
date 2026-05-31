import mongoose from "mongoose";

const databaseUri: string = process.env.MONGODB_URI ?? "";

if (!databaseUri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? {
  connection: null,
  promise: null
};

global.mongooseCache = cache;

export async function connectDatabase() {
  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(databaseUri, {
      bufferCommands: false
    });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
