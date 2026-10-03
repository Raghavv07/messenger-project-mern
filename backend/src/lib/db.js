import mongoose from "mongoose";

/**
 * Connect to MongoDB with production-grade connection pooling and lifecycle event listeners.
 * Follows Mongoose Connections and Production Guide.
 */
export async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is required in environment variables");
    }

    // Configure connection pool, timeouts, and autoIndex according to Mongoose best practices
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections in pool
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if server unreachable
      socketTimeoutMS: 45000, // Close inactive sockets after 45s
      autoIndex: process.env.NODE_ENV !== "production", // Build indexes only in development
    });

    console.log("✅ MongoDB connected successfully:", conn.connection.host);

    mongoose.connection.on("connected", () => {
      console.log("🔗 MongoDB connection active.");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting automatic reconnection...");
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB initial connection error:", error.message);
    throw error;
  }
}

/**
 * Disconnect cleanly during server shutdown or restarts
 */
export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log("🔒 MongoDB connection closed cleanly.");
    }
  } catch (error) {
    console.error("Error closing MongoDB connection:", error.message);
  }
}
