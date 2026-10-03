import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { clerkMiddleware } from "@clerk/express";

import { connectDB, disconnectDB } from "./lib/db.js";
import { validateEnv, getAllowedOrigins } from "./lib/env.js";
import job from "./lib/cron.js";

import clerkWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server, io } from "./lib/socket.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

// Validate required environment variables at boot
validateEnv();

const PORT = parseInt(process.env.PORT, 10) || 5001;
const isProduction = process.env.NODE_ENV === "production";

// 1. Reverse Proxy Trust (Essential when deployed behind Render, Docker, or Nginx)
app.set("trust proxy", 1);

// 2. Reduce Fingerprinting & Harden HTTP Headers (Express Security Best Practices)
app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// 3. Response Compression (Gzip / Brotli for faster payload transfer)
app.use(compression());

// 4. HTTP Request Logging (excluding health check probes to prevent noise)
app.use(
  morgan(isProduction ? "combined" : "dev", {
    skip: (req) => req.url === "/health",
  }),
);

// 5. CORS Configuration
app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 6. Clerk Webhook endpoint (Requires raw Buffer payload for cryptographic signature verification)
app.use(["/api/webhooks/clerk", "/api/webhooks"], express.raw({ type: "application/json", limit: "5mb" }), clerkWebhook);

// 7. Request Body Parsers with safe payload limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 8. General Rate Limiter for API endpoints
app.use("/api", apiLimiter);

// 9. Authentication Middleware
app.use(clerkMiddleware());

// 10. Comprehensive Health Check & Uptime Monitor Probe
app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: isDbConnected ? "connected" : "disconnected",
  });
});

// Root welcome probe (prevents 404 when visiting the base URL in a browser)
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 Messenger Backend API is up and running!",
    health: "/health",
    status: "ok",
  });
});

// 11. Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// 12. Explicit 404 for unmatched API requests (Express 5 syntax)
app.all("/api/{*splat}", notFoundHandler);

// 13. Static Assets & SPA Catch-All (for production single-page app builds)
const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use(
    express.static(publicDir, {
      maxAge: isProduction ? "1d" : 0,
    }),
  );

  app.get("/{*splat}", (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// 14. Centralized Error Handling Middleware (must be registered after all routes)
app.use(errorHandler);

// 15. Server Initialization
async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn("⚠️  Server starting without initial DB connection (will reconnect automatically).");
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server is up and running on PORT: ${PORT} [${isProduction ? "production" : "development"}]`);

    if (isProduction) {
      job.start();
      console.log("⏰ Keep-alive cron job started.");
    }
  });
}

startServer();

// 16. Graceful Shutdown (Express Production Best Practice)
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 [${signal}] Signal received. Commencing graceful shutdown...`);

  const forceTimeout = setTimeout(() => {
    console.error("⚠️  Shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceTimeout.unref();

  try {
    if (isProduction) {
      job.stop();
      console.log("⏹️  Cron job stopped.");
    }

    await new Promise((resolve) => server.close(resolve));
    console.log("🔒 HTTP server connections drained and closed.");

    await io.close();
    console.log("🔒 Socket.io server closed.");

    await disconnectDB();

    console.log("✅ Graceful shutdown completed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error encountered during graceful shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
