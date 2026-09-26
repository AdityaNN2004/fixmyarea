import mongoose from 'mongoose';

// Serverless lifecycle: an instance can be warm (reuse the connection)
// or cold (create one). Without caching, every invocation opens a new
// connection → Atlas connection limit hit in minutes.
let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}