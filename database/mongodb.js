import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
  throw new Error("Please define DB_URI in env file");
}

const cached = global.mongoose || {
  conn: null,
  promise: null,
};

global.mongoose = cached;

async function connectDB() {
  if (cached.conn) {
    console.log("♻️ Using existing MongoDB connection");
    return cached.conn;
  }

  // Create connection if one isn't already in progress
  if (!cached.promise) {
    console.log("⏳ Connecting to MongoDB...");
    cached.promise = mongoose.connect(DB_URI);
  } else {
    console.log("⏳ MongoDB connection already in progress...");
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB connected successfully in ${NODE_ENV} mode!`);
  } catch (err) {
    cached.promise = null;
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
  return cached.conn;
}

export default connectDB;
