import mongoose from "mongoose";

// Connection string comes from the .env.local file
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to your .env.local file.");
}

// In development, Next.js reloads code often. We store the connection on
// the global object so we reuse it instead of opening a new one every time.
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function connectDB() {
  // Reuse the existing connection if we already have one
  if (cached.conn) return cached.conn;

  // Start connecting only once, even if many requests arrive at the same time
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}