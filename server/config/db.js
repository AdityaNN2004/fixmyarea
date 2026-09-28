import mongoose from 'mongoose';

let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

export async function connectDB() {
  // Healthy cached connection → reuse
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  // Connection died (idle kill, credential rotation, network blip)
  // → drop the stale cache so we reconnect fresh
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        cached.promise = null; // never cache a failure — allow retry next request
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}